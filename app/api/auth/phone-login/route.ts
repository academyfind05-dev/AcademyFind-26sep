import { NextRequest, NextResponse } from "next/server";
import { firebaseAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateIndianPhoneNumber } from "@/lib/phone-validation";


export async function POST(req: NextRequest) {
  // Rate limit: max 10 attempts per minute per IP
  const rl = await checkRateLimit("phone-login", 10, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { idToken, name, autoRegister } = body as {
      idToken?: string;
      name?: string;
      autoRegister?: boolean;
    };

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    if (!firebaseAuth) {
      return NextResponse.json(
        { success: false, error: "Phone authentication service is unavailable." },
        { status: 503 }
      );
    }

    // Verify the Firebase ID token server-side
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const phoneNumber = decoded.phone_number;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "This token does not contain a phone number." },
        { status: 400 }
      );
    }

    // Normalize to 10-digit Indian number
    const rawPhone = phoneNumber.replace(/^\+91/, "");
    const validation = validateIndianPhoneNumber(rawPhone);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error ?? "Invalid phone number." },
        { status: 400 }
      );
    }

    const cleanedPhone = validation.cleanedPhone!;

    // Look up the user by phone number
    let user = await prisma.user.findFirst({
      where: { phone: cleanedPhone },
      select: { id: true, email: true, name: true, isActive: true },
    });

    let isNewUser = false;

    if (!user) {
      if (!autoRegister) {
        return NextResponse.json(
          {
            success: false,
            error: "No account found with this phone number. Please register first.",
            code: "USER_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      // Auto-register new user via phone
      const baseName = (name || "User").trim();
      const namePrefix = baseName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "user";
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername = `${namePrefix}_${cleanedPhone.slice(-4)}_${randomSuffix}`;
      const pseudoEmail = `${cleanedPhone}@phone.academyfind.com`;

      const newUser = await prisma.user.create({
        data: {
          name: baseName,
          email: pseudoEmail,
          emailVerified: false,
          phone: cleanedPhone,
          phoneVerified: true,
          role: "USER",
          isActive: true,
          username: generatedUsername,
          lastLoginAt: new Date(),
        },
        select: { id: true, email: true, name: true, isActive: true },
      });

      user = newUser;
      isNewUser = true;

      // Credit signup bonus
      try {
        const { creditWallet } = await import("@/lib/wallet/credit");
        const { AF_COINS_EARN } = await import("@/lib/wallet/af-coins");
        await creditWallet(user.id, AF_COINS_EARN.SIGN_UP, "SIGN_UP", "Welcome Bonus for registering!");
      } catch (bonusErr) {
        console.warn("[phone-login] Failed to credit welcome bonus:", bonusErr);
      }
    } else {
      if (!user.isActive) {
        return NextResponse.json(
          { success: false, error: "Your account has been deactivated. Contact support." },
          { status: 403 }
        );
      }

      // Mark phone as verified (it was just verified by Firebase OTP)
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true, lastLoginAt: new Date() },
      });
    }

    // Create session directly via Prisma (compatible with Better Auth session structure)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    const tokenRaw = crypto.randomUUID() + crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenRaw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const token = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        token,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
      },
    });

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      isNewUser,
    });

    // Set the better-auth session cookie
    response.cookies.set("better-auth.session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("[phone-login] Error:", err);
    const code = (err as { code?: string })?.code;
    if (code?.startsWith("auth/")) {
      return NextResponse.json(
        { success: false, error: "OTP verification failed. Please try again." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
