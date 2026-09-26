import { NextRequest, NextResponse } from "next/server";
import { updateNotice, deleteNotice } from "@/app/actions/notices";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string; noticeId: string }> }
) {
  try {
    const { noticeId } = await params;
    const body = await request.json();
    const result = await updateNotice(noticeId, body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[PATCH notice error]", error);
    const status = error.message === "UNAUTHORIZED" ? 403 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to update notice" },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string; noticeId: string }> }
) {
  try {
    const { noticeId } = await params;
    const result = await deleteNotice(noticeId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[DELETE notice error]", error);
    const status = error.message === "UNAUTHORIZED" ? 403 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to delete notice" },
      { status }
    );
  }
}
