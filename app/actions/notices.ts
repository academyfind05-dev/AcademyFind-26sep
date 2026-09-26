"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type {
  NoticeCategory,
  NoticePriority,
  NoticeVisibility,
} from "@/app/generated/prisma/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { prisma } from "@/lib/prisma";
import { notifyUserPush } from "@/lib/pushNotifications";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const noticeSchema = z.object({
  title: z.string().trim().min(3, "Title too short").max(120, "Title too long"),
  body: z.string().trim().min(5, "Body too short").max(5000, "Body too long"),
  category: z.enum([
    "GENERAL",
    "EXAM",
    "HOLIDAY",
    "FEE",
    "RESULT",
    "EVENT",
    "ADMISSION",
    "URGENT",
  ] as const),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"] as const),
  visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "STAFF_ONLY"] as const),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().nullable().optional(),
  attachmentUrl: z.string().url("Invalid URL").nullable().optional(),
});

type NoticeInput = z.input<typeof noticeSchema>;

// ─── Access Helpers ───────────────────────────────────────────────────────────

async function assertManagerAccess(userId: string, instituteId: string, userRole: string) {
  if (userRole === "ADMIN") return true;
  const mgr = await prisma.instituteManager.findUnique({
    where: { userId_instituteId: { userId, instituteId } },
  });
  if (!mgr) throw new Error("UNAUTHORIZED");
  return true;
}

async function assertNoticeOwnership(
  noticeId: string,
  userId: string,
  userRole: string,
) {
  const notice = await prisma.instituteNotice.findUnique({
    where: { id: noticeId },
    select: { instituteId: true, authorId: true, isActive: true },
  });
  if (!notice || !notice.isActive) throw new Error("NOTICE_NOT_FOUND");
  if (userRole !== "ADMIN") {
    // Must be a manager of that institute
    await assertManagerAccess(userId, notice.instituteId, userRole);
  }
  return notice;
}

// ─── Fan-out Helpers ──────────────────────────────────────────────────────────

async function fanOutNoticeNotification(
  instituteId: string,
  instituteName: string,
  noticeId: string,
  title: string,
  body: string,
  visibility: NoticeVisibility,
  prefix = "",
) {
  // Determine which member roles get notified
  const roleFilter: string[] =
    visibility === "STAFF_ONLY"
      ? ["TEACHER", "MANAGER"]
      : ["STUDENT", "TEACHER", "MANAGER"];

  const members = await prisma.instituteMembership.findMany({
    where: {
      instituteId,
      status: "ACTIVE",
      isActive: true,
      role: { in: roleFilter as any },
    },
    select: { userId: true },
  });

  if (members.length === 0) return;

  const notifTitle = `${prefix}[${instituteName}] ${title}`;
  const notifBody = body.length > 200 ? body.slice(0, 197) + "..." : body;

  // Batch insert into UserNotification
  await prisma.userNotification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      type: "NOTICE" as const,
      title: notifTitle,
      body: notifBody,
      entityId: noticeId,
    })),
    skipDuplicates: true,
  });

  // Fire-and-forget push notifications for each member
  members.forEach(({ userId }) => {
    notifyUserPush({
      userId,
      title: notifTitle,
      body: notifBody,
      data: { entityId: noticeId, type: "NOTICE" },
    }).catch((err) => console.error("[Notice push error]", err));
  });
}

// ─── Public Actions ───────────────────────────────────────────────────────────

/** Fetch notices for the public institute page (no auth required, PUBLIC only). */
export async function getPublicNotices(instituteId: string) {
  const now = new Date();
  return prisma.instituteNotice.findMany({
    where: {
      instituteId,
      isActive: true,
      visibility: "PUBLIC",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      priority: true,
      isPinned: true,
      expiresAt: true,
      attachmentUrl: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });
}

/** Fetch notices visible to a logged-in member (PUBLIC + MEMBERS_ONLY). */
export async function getMemberNotices(instituteId: string) {
  const now = new Date();
  return prisma.instituteNotice.findMany({
    where: {
      instituteId,
      isActive: true,
      visibility: { in: ["PUBLIC", "MEMBERS_ONLY"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      priority: true,
      isPinned: true,
      expiresAt: true,
      attachmentUrl: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });
}

// ─── Manager Actions ──────────────────────────────────────────────────────────

/** Full notice list for the manager dashboard (all visibility levels). */
export async function getManagerNotices(instituteId: string) {
  const session = await requireAuth();
  await assertManagerAccess(session.user.id, instituteId, session.user.role);

  return prisma.instituteNotice.findMany({
    where: { instituteId, isActive: true },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      priority: true,
      visibility: true,
      isPinned: true,
      expiresAt: true,
      attachmentUrl: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true, image: true } },
    },
  });
}

/** Create a new notice and fan out notifications to all active members. */
export async function createNotice(
  instituteId: string,
  input: NoticeInput,
) {
  const session = await requireAuth();
  await assertManagerAccess(session.user.id, instituteId, session.user.role);
  const data = noticeSchema.parse(input);

  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    select: { name: true, slug: true },
  });
  if (!institute) return { error: "Institute not found." };

  const notice = await prisma.instituteNotice.create({
    data: {
      instituteId,
      authorId: session.user.id,
      title: data.title,
      body: data.body,
      category: data.category as NoticeCategory,
      priority: data.priority as NoticePriority,
      visibility: data.visibility as NoticeVisibility,
      isPinned: data.isPinned,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      attachmentUrl: data.attachmentUrl ?? null,
    },
  });

  // Fan out — skip MEMBERS_ONLY members for STAFF_ONLY, skip all for PUBLIC
  if (data.visibility !== "PUBLIC" || true) {
    await fanOutNoticeNotification(
      instituteId,
      institute.name,
      notice.id,
      data.title,
      data.body,
      data.visibility as NoticeVisibility,
    );
  }

  revalidatePath(`/manager/${instituteId}/notices`);
  revalidatePath(`/institute/${institute.slug}`);
  revalidatePath(`/institute/${institute.slug}/notices`);

  return { success: true, noticeId: notice.id };
}

/** Update an existing notice. Re-notifies members only if priority is CRITICAL. */
export async function updateNotice(
  noticeId: string,
  input: NoticeInput,
) {
  const session = await requireAuth();
  const existing = await assertNoticeOwnership(noticeId, session.user.id, session.user.role);
  const data = noticeSchema.parse(input);

  const notice = await prisma.instituteNotice.update({
    where: { id: noticeId },
    data: {
      title: data.title,
      body: data.body,
      category: data.category as NoticeCategory,
      priority: data.priority as NoticePriority,
      visibility: data.visibility as NoticeVisibility,
      isPinned: data.isPinned,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      attachmentUrl: data.attachmentUrl ?? null,
    },
    select: { id: true, instituteId: true },
  });

  const institute = await prisma.institute.findUnique({
    where: { id: notice.instituteId },
    select: { name: true, slug: true },
  });

  // Only re-notify on CRITICAL updates to avoid spam
  if (data.priority === "CRITICAL" && institute) {
    await fanOutNoticeNotification(
      notice.instituteId,
      institute.name,
      notice.id,
      data.title,
      data.body,
      data.visibility as NoticeVisibility,
      "[Updated] ",
    );
  }

  revalidatePath(`/manager/${notice.instituteId}/notices`);
  if (institute) {
    revalidatePath(`/institute/${institute.slug}`);
    revalidatePath(`/institute/${institute.slug}/notices`);
  }

  return { success: true };
}

/** Soft-delete a notice (sets isActive = false). */
export async function deleteNotice(noticeId: string) {
  const session = await requireAuth();
  const existing = await assertNoticeOwnership(noticeId, session.user.id, session.user.role);

  await prisma.instituteNotice.update({
    where: { id: noticeId },
    data: { isActive: false },
  });

  const institute = await prisma.institute.findUnique({
    where: { id: existing.instituteId },
    select: { slug: true },
  });

  revalidatePath(`/manager/${existing.instituteId}/notices`);
  if (institute) {
    revalidatePath(`/institute/${institute.slug}`);
    revalidatePath(`/institute/${institute.slug}/notices`);
  }

  return { success: true };
}

/** Restore a soft-deleted notice (Admin only). */
export async function restoreNotice(noticeId: string) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("UNAUTHORIZED");

  await prisma.instituteNotice.update({
    where: { id: noticeId },
    data: { isActive: true },
  });

  return { success: true };
}

/** Toggle pin state for a notice. */
export async function pinNotice(noticeId: string, pinned: boolean) {
  const session = await requireAuth();
  const existing = await assertNoticeOwnership(noticeId, session.user.id, session.user.role);

  await prisma.instituteNotice.update({
    where: { id: noticeId },
    data: { isPinned: pinned },
  });

  revalidatePath(`/manager/${existing.instituteId}/notices`);
  return { success: true };
}
