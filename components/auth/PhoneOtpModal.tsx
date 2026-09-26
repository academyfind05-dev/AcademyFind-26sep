"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseClientAuth } from "@/lib/firebase-client";
import toast from "react-hot-toast";
import { Phone, ShieldCheck, Loader2, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import { INDIAN_PHONE_REGEX } from "@/lib/phone-validation";

interface PhoneOtpModalProps {
  /** If true, modal is visible */
  isOpen: boolean;
  /** Called when modal should close (cancelled or error) */
  onClose: () => void;
  /** Called after OTP is verified and server has confirmed. Receives the Firebase idToken. */
  onVerified: (idToken: string, phone: string) => Promise<void>;
  /** Optional: pre-fill phone number (e.g. from profile) */
  defaultPhone?: string;
  /** Title shown at top of modal */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** If true, phone input is disabled (use defaultPhone directly) */
  lockPhone?: boolean;
}

type Step = "phone" | "otp" | "success";

const RESEND_COOLDOWN_SECONDS = 60;

function PhoneOtpModalContent({
  onClose,
  onVerified,
  defaultPhone = "",
  title = "Verify Your Phone",
  subtitle = "We'll send a 6-digit OTP to your mobile number.",
  lockPhone = false,
}: Omit<PhoneOtpModalProps, "isOpen">) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(defaultPhone.replace(/^\+?91/, "").slice(0, 10));
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // OTP input refs for individual digit boxes
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cleanup recaptcha and timer when modal unmounts
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const initRecaptcha = useCallback(() => {
    if (typeof window === "undefined") return null;

    const container = document.getElementById("recaptcha-container");
    if (!container) return null;

    // Reset previous instance if any
    const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier | null };
    if (win.recaptchaVerifier) {
      try {
        win.recaptchaVerifier.clear();
      } catch {
        // ignore
      }
      win.recaptchaVerifier = null;
    }
    container.innerHTML = "";

    try {
      const verifier = new RecaptchaVerifier(
        firebaseClientAuth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved
          },
          "expired-callback": () => {
            toast.error("reCAPTCHA expired. Please try again.");
          },
        }
      );

      win.recaptchaVerifier = verifier;
      recaptchaVerifierRef.current = verifier;
      return verifier;
    } catch (e) {
      console.error("[PhoneOtpModal] RecaptchaVerifier init error:", e);
      return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier | null };
      if (win.recaptchaVerifier) {
        try {
          win.recaptchaVerifier.clear();
        } catch {}
        win.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = useCallback(async () => {
    const cleanedPhone = phone.replace(/\D/g, "").slice(0, 10);
    if (!INDIAN_PHONE_REGEX.test(cleanedPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      const verifier = initRecaptcha();
      if (!verifier) {
        toast.error("Verification setup failed. Please refresh and try again.");
        return;
      }

      const fullPhone = `+91${cleanedPhone}`;
      const result = await signInWithPhoneNumber(firebaseClientAuth, fullPhone, verifier);
      setConfirmation(result);
      setStep("otp");
      startResendTimer();
      toast.success(`OTP sent to +91-${cleanedPhone}`);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string; customData?: Record<string, unknown> };
      console.error("[PhoneOtpModal] sendOtp error:", fbErr.code, fbErr.message, fbErr.customData);
      
      const code = fbErr?.code;
      const msg =
        code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : code === "auth/invalid-phone-number"
          ? "Invalid phone number format."
          : code === "auth/invalid-app-credential"
          ? "Verification failed. Check that phone is in test numbers (+91 9999999999) or authorized domains."
          : fbErr?.message || "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [phone, initRecaptcha, startResendTimer]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6 || !confirmation) return;
    setIsLoading(true);
    try {
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();
      const verifiedPhone = phone.replace(/\D/g, "").slice(0, 10);
      const success = await onVerified(idToken, verifiedPhone);
      if (success !== false) {
        setStep("success");
      }
    } catch (err: unknown) {
      console.error("[PhoneOtpModal] verifyOtp error:", err);
      const code = (err as { code?: string })?.code;
      const msg =
        code === "auth/invalid-verification-code"
          ? "Incorrect OTP. Please check and try again."
          : code === "auth/code-expired"
          ? "OTP has expired. Please request a new one."
          : (err as Error)?.message || "Verification failed. Please try again.";
      toast.error(msg);
      setOtp("");
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [otp, confirmation, onVerified, phone]);

  // Handle digit-by-digit OTP input
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const otpArr = otp.split("");
    otpArr[index] = digit;
    const newOtp = otpArr.join("").slice(0, 6);
    setOtp(newOtp);
    // Auto-advance
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-verify if all 6 digits entered
    if (newOtp.length === 6 && !newOtp.includes("")) {
      // verification will trigger on submit or button click
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setOtp(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Invisible reCAPTCHA container */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-modal-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(245, 158, 11, 0.15), 0 0 0 1px rgba(245, 158, 11, 0.08)",
        }}
      >
        {/* Amber accent glow at top */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200/60">
                <ShieldCheck className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3
                  id="phone-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Steps */}
          <div className="mt-6">
            {step === "phone" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-semibold text-slate-500 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      disabled={lockPhone || isLoading}
                      placeholder="9876543210"
                      maxLength={10}
                      autoFocus
                      className="h-12 w-full rounded-2xl border border-slate-200 pl-14 pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/10 disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Standard SMS rates may apply. An OTP will be sent via SMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 10}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4" />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Change Number (+91 {phone})</span>
                  </button>
                </div>

                {/* 6-box OTP input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Enter the 6-digit code
                  </label>
                  <div
                    className="flex items-center justify-between gap-2"
                    onPaste={handlePasteOtp}
                  >
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otp[idx] || ""}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoFocus={idx === 0}
                        className="h-12 w-12 rounded-xl border border-slate-200 text-center text-xl font-bold text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/10 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>

                {/* Resend section */}
                <div className="flex items-center justify-center pt-2">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-slate-400">
                      Resend in <span className="font-semibold text-amber-600">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">Phone Verified!</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Your number <span className="font-semibold text-slate-700">+91 {phone}</span> has been successfully verified.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 h-10 w-full rounded-xl bg-emerald-500 font-semibold text-white transition-all hover:bg-emerald-600"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PhoneOtpModal({
  isOpen,
  ...props
}: PhoneOtpModalProps) {
  if (!isOpen) return null;
  return <PhoneOtpModalContent {...props} />;
}
