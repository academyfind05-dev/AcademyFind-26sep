import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getAuth();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[firebase-admin] Missing required environment variables:", {
      hasProjectId: Boolean(projectId),
      hasClientEmail: Boolean(clientEmail),
      hasPrivateKey: Boolean(privateKey),
    });
    return null;
  }

  try {
    // Strip surrounding quotes if user wrapped the key in quotes in Vercel UI
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    // Replace escaped \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("[firebase-admin] Initialized successfully.");
    return getAuth();
  } catch (error) {
    console.error("[firebase-admin] Initialization error:", error);
    return null;
  }
}

export function getFirebaseAuth() {
  return initFirebaseAdmin();
}

export const firebaseAuth = initFirebaseAdmin();
