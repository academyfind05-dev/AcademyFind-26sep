import { NextResponse } from "next/server";
import { getCachedSession } from "@/lib/auth/session";

// TEMPORARY DEBUG ENDPOINT - REMOVE AFTER FIXING
// Visit: /api/debug/firebase-admin to see server status
export async function GET() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

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

  // Try initializing firebase admin fresh
  let adminStatus: any = "not attempted";
  try {
    const { getFirebaseAuth } = await import("@/lib/firebase-admin");
    const auth = getFirebaseAuth();
    adminStatus = auth
      ? "Firebase Admin initialized OK ✅"
      : "Firebase Admin returned null ❌ - check env vars";
  } catch (e: any) {
    adminStatus = `Firebase Admin init ERROR: ${e.message}`;
  }

  return NextResponse.json({
    env: {
      FIREBASE_PROJECT_ID: projectId ? `SET (${projectId})` : "MISSING ❌",
      FIREBASE_CLIENT_EMAIL: clientEmail
        ? `SET (${clientEmail.slice(0, 20)}...)`
        : "MISSING ❌",
      FIREBASE_PRIVATE_KEY: privateKey
        ? `SET - length: ${privateKey.length}, starts: ${privateKey.slice(0, 30)}`
        : "MISSING ❌",
    },
    adminStatus,
    session: sessionInfo,
  });
}
