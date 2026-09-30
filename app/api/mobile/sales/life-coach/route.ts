import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/getSession";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SALES_MANAGER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || session.user.id;
    const status = searchParams.get("status") || "ALL";

    const whereCondition: any = {
      assignedSalesManagerId: id,
    };

    if (status !== "ALL") {
      whereCondition.status = status;
    }

    const [requests, totalCount, pendingCount] = await Promise.all([
      prisma.lifeCoachRequest.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lifeCoachRequest.count({
        where: { assignedSalesManagerId: id },
      }),
      prisma.lifeCoachRequest.count({
        where: { assignedSalesManagerId: id, status: "PENDING" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        requests,
        counts: {
          total: totalCount,
          pending: pendingCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Mobile Sales Life Coach Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SALES_MANAGER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, status, salesManagerNote } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "requestId is required" }, { status: 400 });
    }

    const existing = await prisma.lifeCoachRequest.findUnique({
      where: { id: requestId },
      select: { id: true, assignedSalesManagerId: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    if (session.user.role === "SALES_MANAGER" && existing.assignedSalesManagerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: Not assigned to you" }, { status: 403 });
    }

    const updateData: any = {
      lastUpdatedByRole: session.user.role,
      lastUpdatedByName: session.user.name || "Sales Manager",
    };

    if (status) updateData.status = status;
    if (salesManagerNote !== undefined) updateData.salesManagerNote = salesManagerNote;

    const updated = await prisma.lifeCoachRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Mobile Sales Life Coach Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
