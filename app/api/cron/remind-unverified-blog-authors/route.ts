import { NextRequest, NextResponse } from "next/server";
import { runPeriodicBlogPhoneReminders } from "@/lib/notifications/blogPhoneVerificationReminders";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow authorization via Bearer token matching CRON_SECRET, or in development mode
    if (
      process.env.NODE_ENV !== "development" &&
      cronSecret &&
      authHeader !== `Bearer ${cronSecret}`
    ) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await runPeriodicBlogPhoneReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[remind-unverified-blog-authors] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
