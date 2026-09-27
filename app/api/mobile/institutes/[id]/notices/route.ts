import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const institute = await prisma.institute.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true,
      },
    });

    if (!institute) {
      return NextResponse.json(
        { success: false, error: "Institute not found" },
        { status: 404 }
      );
    }

    const plan = institute.subscriptionPlan || "BASIC";
    const isEligible = plan === "PREMIUM" || plan === "ULTRA";

    if (!isEligible) {
      return NextResponse.json({
        success: true,
        data: {
          notices: [],
          isEligible: false,
          subscriptionPlan: plan,
          totalCount: 0,
        },
      });
    }

    const now = new Date();
    const notices = await prisma.instituteNotice.findMany({
      where: {
        instituteId: institute.id,
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
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        notices,
        isEligible: true,
        subscriptionPlan: plan,
        totalCount: notices.length,
      },
    });
  } catch (error: any) {
    console.error("[Mobile Institute Notices GET Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}
