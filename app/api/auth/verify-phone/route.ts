import { NextRequest, NextResponse } from "next/server";
import { firebaseAuth, getFirebaseAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { getCachedSession } from "@/lib/auth/session";
import { validateIndianPhoneNumber } from "@/lib/phone-validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: max 10 attempts per minute per IP
  const rl = await checkRateLimit("verify-phone", 10, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const session = await getCachedSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to verify your phone." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { idToken } = body as { idToken?: string };

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    const auth = getFirebaseAuth() || firebaseAuth;
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Phone verification service configuration missing on server (check Firebase Admin credentials)." },
        { status: 503 }
      );
    }

    // Verify the Firebase ID token server-side (cannot be forged by the client)
    const decoded = await auth.verifyIdToken(idToken);
    const phoneNumber = decoded.phone_number;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "This token does not contain a phone number." },
        { status: 400 }
      );
    }

    // Extract the 10-digit number from E.164 format (+91XXXXXXXXXX)
    const rawPhone = phoneNumber.replace(/^\+91/, "");
    const validation = validateIndianPhoneNumber(rawPhone);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error ?? "Invalid phone number." },
        { status: 400 }
      );
    }

    const cleanedPhone = validation.cleanedPhone!;

    // Check if this number is already used by a different account
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: cleanedPhone,
        id: { not: session.user.id },
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "This phone number is already linked to another account." },
        { status: 409 }
      );
    }

    // Update the user: set phone + phoneVerified = true
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: cleanedPhone,
        phoneVerified: true,
      },
    });

    return NextResponse.json({ success: true, phone: cleanedPhone });
  } catch (err: unknown) {
    console.error("[verify-phone] Error:", err);
    const errObj = err as { code?: string; message?: string };
    const code = errObj?.code;
    if (code?.startsWith("auth/")) {
      return NextResponse.json(
        { success: false, error: "OTP verification failed. Please try again." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: errObj?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
