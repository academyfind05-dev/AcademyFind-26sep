"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Phone, Mail, X, ShieldCheck, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import PhoneOtpModal from "./PhoneOtpModal";

type NudgeType = "phone" | "email" | null;

interface VerificationNudgeResponse {
  authenticated: boolean;
  shouldNudge: boolean;
  nudgeType: NudgeType;
  phone?: string;
  phoneVerified?: boolean;
  email?: string;
  hasWrittenBlog: boolean;
  blogCount?: number;
}

/**
 * PhoneNudgeBanner
 *
 * Exclusively targeted to users who have written, submitted, or published a blog:
 * - Hidden completely for regular students, visitors, and users without blog activity.
 * - For blog authors: Nudges to verify phone/email so the AcademyFind team can reach them.
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

    async function checkNudgeEligibility() {
      try {
        const res = await fetch("/api/user/verification-nudge");
        if (!res.ok || !isMounted) return;

        const data: VerificationNudgeResponse = await res.json();
        if (!isMounted) return;

        // Strictly verify that the user has written, submitted, or published a blog
        if (!data.authenticated || !data.hasWrittenBlog || !data.shouldNudge) {
          setNudgeType(null);
          return;
        }

        // Check if user already dismissed for this browsing session
        const sessionDismissed = sessionStorage.getItem("af_blog_author_nudge_dismissed");
        if (sessionDismissed === "true") {
          setDismissed(true);
        }

        setUserPhone(data.phone ?? "");
        setPhoneVerified(Boolean(data.phoneVerified));
        setNudgeType(data.nudgeType);

        // Don't show toast if dismissed in this session
        if (sessionDismissed === "true") return;

        // Case 1: Phone not verified for blog author
        if (data.nudgeType === "phone") {
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
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded">
                        <FileText className="h-2.5 w-2.5" /> Blog Author
                      </span>
                      <button
                        type="button"
                        onClick={() => toast.dismiss(t.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                        aria-label="Close notification"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      Verify Your Phone Number
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      You have blog articles on AcademyFind. Please verify your mobile number so our team can reach you regarding publication.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toast.dismiss(t.id);
                          setIsOtpModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-xs px-3 py-1.5 shadow-sm shadow-amber-500/25 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verify Phone
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
          }, 1500);
        } else if (data.nudgeType === "email") {
          // Case 2: Email missing for blog author
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
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded">
                        <FileText className="h-2.5 w-2.5" /> Blog Author
                      </span>
                      <button
                        type="button"
                        onClick={() => toast.dismiss(t.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                        aria-label="Close notification"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      Add Your Email Address
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      You have blog articles on AcademyFind. Please add your email so our editorial team can contact you.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Link
                        href="/settings/profile"
                        onClick={() => toast.dismiss(t.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-xs px-3 py-1.5 shadow-sm shadow-amber-500/25 transition-all"
                      >
                        Add Email <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ),
              {
                id: "af-email-nudge",
                duration: 9000,
                position: "top-center",
              }
            );
          }, 1500);
        }
      } catch (err) {
        console.error("[PhoneNudgeBanner] Failed to check eligibility:", err);
      }
    }

    checkNudgeEligibility();

    return () => {
      isMounted = false;
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem("af_blog_author_nudge_dismissed", "true");
    } catch {
      // ignore storage errors
    }
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
        toast.dismiss("af-phone-otp-status");
        toast.dismiss("af-phone-verification-nudge");
        toast.success("Phone number verified successfully! 🎉", {
          id: "af-phone-verified-success",
          duration: 3500,
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
          subtitle="Add and verify your mobile number so our team can reach you regarding your blog articles."
        />
      )}

      {/* Top Banner (shows ONLY to blog authors who are unverified) */}
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
                    <span className="font-bold text-amber-900">Blog Author Action:</span> Verify your phone number so our editorial team can reach you regarding your articles.
                  </>
                ) : (
                  <>
                    <span className="font-bold text-amber-900">Blog Author Action:</span> Add your email so our editorial team can reach you regarding your articles.
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
                className="rounded-full p-1 text-amber-700/60 hover:bg-amber-100 hover:text-amber-900 transition-colors cursor-pointer"
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
