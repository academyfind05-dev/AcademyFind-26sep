import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createNotice, getPublicNotices } from "@/app/actions/notices";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const { instituteId } = await params;
    const notices = await getPublicNotices(instituteId);
    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error("[GET /api/institutes/[instituteId]/notices error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notices" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const { instituteId } = await params;
    const body = await request.json();
    const result = await createNotice(instituteId, body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/institutes/[instituteId]/notices error]", error);
    const status = error.message === "UNAUTHORIZED" ? 403 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to create notice" },
      { status }
    );
  }
}
