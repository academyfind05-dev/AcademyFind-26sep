import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/getSession";
import type { NoticeCategory, NoticePriority, NoticeVisibility } from "@/app/generated/prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string; noticeId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { instituteId, noticeId } = await params;

    // Verify manager access
    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId },
    });
    if (!isManager && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: { subscriptionPlan: true },
    });
    const plan = institute?.subscriptionPlan || "BASIC";
    if (plan !== "PREMIUM" && plan !== "ULTRA") {
      return NextResponse.json(
        { success: false, error: "Notice board requires a Premium or Ultra subscription." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: content, category, priority, visibility, isPinned, expiresAt, attachmentUrl } = body;

    const updated = await prisma.instituteNotice.update({
      where: { id: noticeId, instituteId },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(content ? { body: content.trim() } : {}),
        ...(category ? { category: category as NoticeCategory } : {}),
        ...(priority ? { priority: priority as NoticePriority } : {}),
        ...(visibility ? { visibility: visibility as NoticeVisibility } : {}),
        ...(typeof isPinned === "boolean" ? { isPinned } : {}),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachmentUrl: attachmentUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[Mobile Manager Notice PUT Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string; noticeId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { instituteId, noticeId } = await params;

    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId },
    });
    if (!isManager && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { isPinned, isActive } = body;

    const updated = await prisma.instituteNotice.update({
      where: { id: noticeId, instituteId },
      data: {
        ...(typeof isPinned === "boolean" ? { isPinned } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[Mobile Manager Notice PATCH Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string; noticeId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { instituteId, noticeId } = await params;

    const isManager = await prisma.instituteManager.findFirst({
      where: { userId: session.user.id, instituteId },
    });
    if (!isManager && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.instituteNotice.update({
      where: { id: noticeId, instituteId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Notice deleted" });
  } catch (error: any) {
    console.error("[Mobile Manager Notice DELETE Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
