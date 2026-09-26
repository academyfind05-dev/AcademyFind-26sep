import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/auth/session";
import { triggerBlogPhoneVerificationAbandoned } from "@/lib/notifications/blogPhoneVerificationReminders";

export async function POST(req: NextRequest) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId } = body as { postId?: string };

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ success: false, error: "Missing postId" }, { status: 400 });
    }

    const result = await triggerBlogPhoneVerificationAbandoned({
      postId,
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[abandon-phone-verification] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process verification abandonment" },
      { status: 500 }
    );
  }
}
