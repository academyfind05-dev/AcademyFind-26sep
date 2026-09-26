import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "academyfind-1725e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "academyfind-1725e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "academyfind-1725e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "561439451313",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:561439451313:web:a7d8550028eaaacc911a90",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-7N7SMXBLJE",
};

// Singleton initialization to prevent duplicate app errors on hot reloads
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseClientAuth = getAuth(firebaseApp);
