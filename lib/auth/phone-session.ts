"use server";

import { getCachedSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type PhoneVerificationStatus = {
  isLoggedIn: boolean;
  phone: string | null;
  phoneVerified: boolean;
  hasPassword: boolean; // to know if they can log in with email
};

/**
 * Gets the current user's phone verification status.
 * Used by blog submission gate and nudge system.
 */
export async function getPhoneVerificationStatus(): Promise<PhoneVerificationStatus> {
  const session = await getCachedSession();

  if (!session?.user?.id) {
    return { isLoggedIn: false, phone: null, phoneVerified: false, hasPassword: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, phoneVerified: true, passwordHash: true },
  });

  return {
    isLoggedIn: true,
    phone: user?.phone ?? null,
    phoneVerified: user?.phoneVerified ?? false,
    hasPassword: Boolean(user?.passwordHash),
  };
}
