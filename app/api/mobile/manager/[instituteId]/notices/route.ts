import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/getSession";
import { notifyUserPush } from "@/lib/pushNotifications";
import type { NoticeCategory, NoticePriority, NoticeVisibility } from "@/app/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { instituteId } = await params;

    // Verify manager access
    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId },
    });
    if (!isManager && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: { id: true, name: true, subscriptionPlan: true },
    });
    if (!institute) {
      return NextResponse.json({ success: false, error: "Institute not found" }, { status: 404 });
    }

    const plan = institute.subscriptionPlan || "BASIC";
    const canPostNotices = plan === "PREMIUM" || plan === "ULTRA";

    const notices = await prisma.instituteNotice.findMany({
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

    const totalCount = notices.length;
    const pinnedCount = notices.filter((n) => n.isPinned).length;
    const urgentCount = notices.filter((n) => n.category === "URGENT").length;

    return NextResponse.json({
      success: true,
      data: {
        notices,
        canPostNotices,
        subscriptionPlan: plan,
        instituteName: institute.name,
        stats: {
          total: totalCount,
          pinned: pinnedCount,
          urgent: urgentCount,
        },
      },
    });
  } catch (error: any) {
    console.error("[Mobile Manager Notices GET Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { instituteId } = await params;

    // Verify manager access
    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId },
    });
    if (!isManager && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: { id: true, name: true, slug: true, subscriptionPlan: true },
    });
    if (!institute) {
      return NextResponse.json({ success: false, error: "Institute not found" }, { status: 404 });
    }

    const plan = institute.subscriptionPlan || "BASIC";
    if (plan !== "PREMIUM" && plan !== "ULTRA") {
      return NextResponse.json(
        {
          success: false,
          error: "Notice board is only available for institutes with a Premium or Ultra subscription. Please upgrade your plan.",
          requiresUpgrade: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: content, category, priority, visibility, isPinned, expiresAt, attachmentUrl } = body;

    if (!title || title.trim().length < 3) {
      return NextResponse.json({ success: false, error: "Title must be at least 3 characters" }, { status: 400 });
    }
    if (!content || content.trim().length < 5) {
      return NextResponse.json({ success: false, error: "Content must be at least 5 characters" }, { status: 400 });
    }

    const notice = await prisma.instituteNotice.create({
      data: {
        instituteId,
        authorId: session.user.id,
        title: title.trim(),
        body: content.trim(),
        category: (category || "GENERAL") as NoticeCategory,
        priority: (priority || "NORMAL") as NoticePriority,
        visibility: (visibility || "PUBLIC") as NoticeVisibility,
        isPinned: !!isPinned,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachmentUrl: attachmentUrl || null,
      },
    });

    // Notify enrolled members asynchronously
    try {
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

      if (members.length > 0) {
        const notifTitle = `[${institute.name}] ${notice.title}`;
        const notifBody = notice.body.length > 200 ? notice.body.slice(0, 197) + "..." : notice.body;

        await prisma.userNotification.createMany({
          data: members.map((m) => ({
            userId: m.userId,
            type: "NOTICE" as const,
            title: notifTitle,
            body: notifBody,
            entityId: notice.id,
          })),
          skipDuplicates: true,
        });

        members.forEach(({ userId }) => {
          notifyUserPush({
            userId,
            title: notifTitle,
            body: notifBody,
            data: { entityId: notice.id, type: "NOTICE" },
          }).catch((err) => console.error("[Notice push error]", err));
        });
      }
    } catch (notifErr) {
      console.error("[Mobile Notice notification fanout error]", notifErr);
    }

    return NextResponse.json({ success: true, data: notice }, { status: 201 });
  } catch (error: any) {
    console.error("[Mobile Manager Notices POST Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
