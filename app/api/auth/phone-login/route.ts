import { NextRequest, NextResponse } from "next/server";
import { firebaseAuth, getFirebaseAuth } from "@/lib/firebase-admin";
import { auth as betterAuth } from "@/lib/auth/auth";
import { makeSignature } from "better-auth/crypto";
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

    const auth = getFirebaseAuth() || firebaseAuth;
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Phone authentication service configuration missing on server (check Firebase Admin credentials)." },
        { status: 503 }
      );
    }

    // Verify the Firebase ID token server-side
    const decoded = await auth.verifyIdToken(idToken);
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

    // Create session via Better Auth internal adapter and sign cookie with Better Auth secret
    const ctx = await (betterAuth as any).$context;
    const session = await ctx.internalAdapter.createSession(user.id);
    const signature = await makeSignature(session.token, ctx.secret);
    const signedCookieValue = `${session.token}.${signature}`;

    const cookieName = ctx.authCookies.sessionToken.name;
    const cookieAttrs = ctx.authCookies.sessionToken.attributes;

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      isNewUser,
      token: session.token,
    });

    // Set the primary Better Auth signed cookie
    response.cookies.set(cookieName, signedCookieValue, {
      ...cookieAttrs,
      expires: session.expiresAt,
    });

    // If secure prefix was added, also set plain cookie as development/localhost fallback
    if (cookieName !== "better-auth.session_token") {
      response.cookies.set("better-auth.session_token", signedCookieValue, {
        ...cookieAttrs,
        secure: false,
        expires: session.expiresAt,
      });
    }

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
