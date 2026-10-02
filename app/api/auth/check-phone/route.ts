import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateIndianPhoneNumber } from "@/lib/phone-validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: max 20 requests per minute per IP
  const rl = await checkRateLimit("check-phone", 20, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { allowed: false, error: "Too many attempts. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { phone, mode } = body as { phone?: string; mode?: "login" | "register" };

    if (!phone) {
      return NextResponse.json(
        { allowed: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    const validation = validateIndianPhoneNumber(phone);
    if (!validation.isValid) {
      return NextResponse.json(
        { allowed: false, error: validation.error ?? "Invalid phone number." },
        { status: 400 }
      );
    }

    const cleanedPhone = validation.cleanedPhone!;

    const user = await prisma.user.findFirst({
      where: { phone: cleanedPhone },
      select: { id: true, isActive: true, phoneVerified: true },
    });

    if (mode === "login") {
      if (!user) {
        return NextResponse.json({
          allowed: false,
          error: "No account found with this phone number. Please register first.",
          code: "USER_NOT_FOUND",
        });
      }

      if (!user.isActive) {
        return NextResponse.json({
          allowed: false,
          error: "This account has been deactivated. Please contact support.",
          code: "USER_DEACTIVATED",
        });
      }

      return NextResponse.json({ allowed: true });
    }

    if (mode === "register") {
      if (user) {
        return NextResponse.json({
          allowed: false,
          error: "This phone number is already registered. Please log in instead.",
          code: "PHONE_EXISTS",
        });
      }

      return NextResponse.json({ allowed: true });
    }

    return NextResponse.json({ allowed: true });
  } catch (err) {
    console.error("[check-phone] Error:", err);
    return NextResponse.json(
      { allowed: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
