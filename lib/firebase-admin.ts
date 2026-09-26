/**
 * Firebase ID Token Server Verification
 * 
 * Verifies Firebase ID Tokens server-side without relying on `firebase-admin` + `jwks-rsa`,
 * completely avoiding the Node.js / Vercel `ERR_REQUIRE_ESM` bundling conflicts.
 * 
 * Primary: Google Identity Toolkit REST API (`accounts:lookup`)
 * Fallback: RS256 JWT signature verification against Google's public JWKS endpoint via `jose`
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

export interface DecodedFirebaseToken {
  uid: string;
  phone_number?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

const GOOGLE_JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
);
let remoteJWKSet: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!remoteJWKSet) {
    remoteJWKSet = createRemoteJWKSet(GOOGLE_JWKS_URL);
  }
  return remoteJWKSet;
}

/**
 * Verify a Firebase ID Token.
 * Attempts Google Identity Toolkit REST API first, then falls back to cryptographic JWKS verification.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedFirebaseToken> {
  const apiKey =
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // Method 1: Google Identity Toolkit REST API
  if (apiKey) {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await res.json();

      if (res.ok && data.users && data.users.length > 0) {
        const user = data.users[0];
        return {
          uid: user.localId,
          phone_number: user.phoneNumber,
          email: user.email,
          email_verified: user.emailVerified,
          name: user.displayName,
          picture: user.photoUrl,
          ...user,
        };
      }

      // If Google explicitly rejected the token (e.g. invalid/expired), throw with auth/ code
      if (!res.ok && data.error?.message) {
        const errorMsg = data.error.message;
        console.warn("[firebase-token] Identity Toolkit rejected token:", errorMsg);
        const err = new Error(errorMsg) as Error & { code: string };
        err.code = "auth/invalid-id-token";
        throw err;
      }
    } catch (e: any) {
      if (e?.code?.startsWith("auth/")) {
        throw e;
      }
      console.warn("[firebase-token] Identity Toolkit fetch failed, falling back to JWKS:", e.message);
    }
  }

  // Method 2: Fallback to direct RS256 JWT cryptographic validation via Google's JWKS
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "academyfind-1725e";

  try {
    const JWKS = getJWKS();
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    return {
      uid: (payload.sub || payload.user_id) as string,
      phone_number: payload.phone_number as string | undefined,
      email: payload.email as string | undefined,
      email_verified: payload.email_verified as boolean | undefined,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
      ...payload,
    };
  } catch (jwksErr: any) {
    console.error("[firebase-token] JWKS token verification failed:", jwksErr.message);
    const err = new Error(jwksErr.message || "Invalid or expired Firebase ID token") as Error & { code: string };
    err.code = "auth/invalid-id-token";
    throw err;
  }
}

// Backward-compatible auth object matching the firebase-admin auth interface used throughout the app
export const firebaseAuth = {
  verifyIdToken: async (idToken: string): Promise<DecodedFirebaseToken> => {
    return verifyFirebaseIdToken(idToken);
  },
};

export function getFirebaseAuth() {
  return firebaseAuth;
}
