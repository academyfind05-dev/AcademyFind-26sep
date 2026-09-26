import { NextResponse } from "next/server";
import { getCachedSession } from "@/lib/auth/session";

// TEMPORARY DEBUG ENDPOINT - REMOVE AFTER FIXING
// Visit: /api/debug/firebase-admin to see server status
export async function GET() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey =
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // Check session
  let sessionInfo: any = null;
  try {
    const session = await getCachedSession();
    sessionInfo = session
      ? { userId: session.user?.id, email: session.user?.email }
      : "NO SESSION";
  } catch (e: any) {
    sessionInfo = `Session error: ${e.message}`;
  }

  // Test token verifier initialization
  let verifierStatus: any = "not attempted";
  try {
    const { getFirebaseAuth } = await import("@/lib/firebase-admin");
    const auth = getFirebaseAuth();
    if (auth && typeof auth.verifyIdToken === "function") {
      // Test if Google Identity Toolkit REST API is reachable
      const testRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: "ping_test" }),
        }
      );
      const testJson = await testRes.json();
      const code = testJson?.error?.message;
      if (code === "INVALID_ID_TOKEN" || code === "MALFORMED_JWT" || code === "ARGUMENT_ERROR") {
        verifierStatus = "Verification engine ACTIVE & READY (Google Identity Toolkit reachable) ✅";
      } else {
        verifierStatus = `Google Identity Toolkit returned: ${code || JSON.stringify(testJson)} (JWKS fallback will be used if needed)`;
      }
    } else {
      verifierStatus = "Verifier returned null or invalid interface ❌";
    }
  } catch (e: any) {
    verifierStatus = `Verifier ERROR: ${e.message}`;
  }

  return NextResponse.json({
    env: {
      FIREBASE_PROJECT_ID: projectId ? `SET (${projectId})` : "MISSING ❌",
      FIREBASE_API_KEY: apiKey
        ? `SET (${apiKey.slice(0, 8)}...${apiKey.slice(-4)})`
        : "MISSING ❌",
    },
    verifierStatus,
    session: sessionInfo,
  });
}
