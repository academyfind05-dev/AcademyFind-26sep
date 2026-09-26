"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";

async function assertAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function adminToggleNoticeActive(noticeId: string, currentActive: boolean) {
  try {
    await assertAdmin();
    await prisma.instituteNotice.update({
      where: { id: noticeId },
      data: { isActive: !currentActive },
    });
    revalidatePath("/af-ass-manage/notices");
    return { success: true };
  } catch (error: any) {
    console.error("[adminToggleNoticeActive error]", error);
    return { success: false, error: error.message || "Failed to update notice status" };
  }
}

export async function adminToggleNoticePin(noticeId: string, currentPinned: boolean) {
  try {
    await assertAdmin();
    await prisma.instituteNotice.update({
      where: { id: noticeId },
      data: { isPinned: !currentPinned },
    });
    revalidatePath("/af-ass-manage/notices");
    return { success: true };
  } catch (error: any) {
    console.error("[adminToggleNoticePin error]", error);
    return { success: false, error: error.message || "Failed to update pin state" };
  }
}

export async function adminDeleteNoticePermanently(noticeId: string) {
  try {
    await assertAdmin();
    await prisma.instituteNotice.delete({
      where: { id: noticeId },
    });
    revalidatePath("/af-ass-manage/notices");
    return { success: true };
  } catch (error: any) {
    console.error("[adminDeleteNoticePermanently error]", error);
    return { success: false, error: error.message || "Failed to permanently delete notice" };
  }
}
