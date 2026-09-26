"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Phone, Mail, X, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import PhoneOtpModal from "./PhoneOtpModal";

type NudgeType = "phone" | "email" | null;

/**
 * PhoneNudgeBanner
 *
 * Shown to logged-in users who are missing a verified phone or email:
 * - Email-login user with no verified phone → Prompt & toast every refresh/visit until verified
 * - Phone-login user with no email → Nudge to add & verify email
 *
 * Clicking "Verify Phone" opens the PhoneOtpModal directly on the screen without leaving the page.
 */
export default function PhoneNudgeBanner() {
  const [nudgeType, setNudgeType] = useState<NudgeType>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [userPhone, setUserPhone] = useState<string>("");
  const [, setPhoneVerified] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data: session } = await authClient.getSession();
        if (!isMounted || !session?.user) return;

        const user = session.user as {
          phone?: string | null;
          phoneVerified?: boolean;
          email?: string | null;
        };

        const isVerified: boolean = user.phoneVerified ?? false;
        setUserPhone(user.phone ?? "");
        setPhoneVerified(isVerified);

        // Case 1: Phone not verified -> notify every visit / refresh until verified
        if (!isVerified) {
          if (isMounted) setNudgeType("phone");

          // Trigger toast notification on every visit / refresh
          toastTimeoutRef.current = setTimeout(() => {
            if (!isMounted) return;

            toast.custom(
              (t) => (
                <div
                  className={`flex items-start gap-3 w-full max-w-sm bg-amber-50/95 backdrop-blur-md border border-amber-300 shadow-xl shadow-amber-900/10 rounded-2xl p-3.5 text-slate-800 transition-all ${
                    t.visible ? "animate-in fade-in slide-in-from-top-3" : "animate-out fade-out"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                        Action Required
                      </span>
                      <button
                        type="button"
                        onClick={() => toast.dismiss(t.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      Verify Your Phone Number
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Add and verify your mobile number to publish blogs and secure your account.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toast.dismiss(t.id);
                          setIsOtpModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-xs px-3 py-1.5 shadow-sm shadow-amber-500/25 transition-all"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verify Now
                      </button>
                      <Link
                        href="/settings/profile"
                        onClick={() => toast.dismiss(t.id)}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 transition-colors"
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                </div>
              ),
              {
                id: "af-phone-verification-nudge",
                duration: 9000,
                position: "top-center",
              }
            );
          }, 1200);
        } else if (
          isVerified &&
          (!user.email || user.email.endsWith("@phone.academyfind.com"))
        ) {
          // Case 2: Email nudge: registered with phone, no real email attached
          if (isMounted) setNudgeType("email");

          toastTimeoutRef.current = setTimeout(() => {
            if (!isMounted) return;
            toast(
              (t) => (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Add Your Email Address</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Link an email to recover your account and receive important updates.
                    </p>
                    <Link
                      href="/settings/profile"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                      onClick={() => toast.dismiss(t.id)}
                    >
                      Add Email now <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ),
              {
                id: "af-email-nudge",
                duration: 8000,
                style: {
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  maxWidth: "360px",
                },
              }
            );
          }, 1500);
        }
      } catch {
        // Silently catch network or session errors
      }
    }

    checkSession();

    return () => {
      isMounted = false;
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const handlePhoneVerified = useCallback(async (idToken: string, verifiedPhone: string) => {
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("[PhoneNudgeBanner] Non-JSON response from server:", res.status, jsonErr);
        toast.error(`Server error (${res.status}). Could not verify phone number.`);
        return false;
      }

      if (data?.success) {
        setPhoneVerified(true);
        setUserPhone(verifiedPhone);
        setNudgeType(null);
        setIsOtpModalOpen(false);
        toast.dismiss("af-phone-verification-nudge");
        toast.success("Phone number verified successfully! 🎉", {
          duration: 5000,
          style: {
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            fontWeight: "600",
            borderRadius: "12px",
          },
        });
        return true;
      } else {
        toast.error(data?.error ?? "Verification failed. Please try again.");
        return false;
      }
    } catch (err) {
      console.error("[PhoneNudgeBanner] Network error:", err);
      toast.error("Network error. Could not verify phone number.");
      return false;
    }
  }, []);

  return (
    <>
      {/* Direct in-place phone OTP modal */}
      {isOtpModalOpen && (
        <PhoneOtpModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          defaultPhone={userPhone}
          onVerified={handlePhoneVerified}
          title="Verify Your Phone"
          subtitle="Add and verify your mobile number to submit blogs and secure your account."
        />
      )}

      {/* Top Banner (shows on every visit/refresh if unverified) */}
      {nudgeType && !dismissed && (
        <div className="relative z-50 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/80 shadow-xs">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                {nudgeType === "phone" ? (
                  <Phone className="h-3.5 w-3.5" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
              </div>
              <p className="truncate text-xs font-medium text-amber-950">
                {nudgeType === "phone" ? (
                  <>
                    <span className="font-bold text-amber-900">Verify your phone number</span> — required for blog submission &amp; account security.
                  </>
                ) : (
                  <>
                    <span className="font-bold text-amber-900">Add your email</span> — so you can recover your account anytime.
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {nudgeType === "phone" ? (
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 px-3 py-1 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:shadow-md cursor-pointer"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Verify Phone
                </button>
              ) : (
                <Link
                  href="/settings/profile"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 px-3 py-1 text-[11px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:shadow-md"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Add Email
                </Link>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                className="rounded-full p-1 text-amber-700/60 hover:bg-amber-100 hover:text-amber-900 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
