"use client";

import { useActionState, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";

import {
  updateProfile,
  updateStudentProfile,
  updateTeacherProfile,
} from "@/app/(app)/settings/actions";
import {
  ActionMessage,
  SubmitButton,
} from "@/app/(app)/settings/components/FormStatus";
import PhoneOtpModal from "@/components/auth/PhoneOtpModal";

const initial = { success: false, message: "" };
const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-400";

type Props = {
  user: {
    name: string | null;
    username: string | null;
    phone: string | null;
    phoneVerified: boolean;
    image: string | null;
    coverImage: string | null;
  };
  student: {
    headline: string | null;
    bio: string | null;
    targetExam: string | null;
    currentClass: string | null;
    isVisible: boolean;
  } | null;
  teacher: {
    headline: string | null;
    bio: string | null;
    qualification: string | null;
    experience: string | null;
    subjects: string[];
    languages: string[];
    isVisible: boolean;
  } | null;
};

export function ProfileForms({ user, student, teacher }: Props) {
  const [profileState, profileAction] = useActionState(updateProfile, initial);
  const [studentState, studentAction] = useActionState(updateStudentProfile, initial);
  const [teacherState, teacherAction] = useActionState(updateTeacherProfile, initial);

  // Phone verification UI state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(user.phoneVerified);
  const [currentPhone, setCurrentPhone] = useState(user.phone ?? "");

  const handleVerified = useCallback(async (idToken: string, phone: string) => {
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        toast.error(`Server error (${res.status}). Please try again.`);
        return false;
      }

      if (data?.success) {
        setPhoneVerified(true);
        setCurrentPhone(phone);
        toast.success("Phone number verified successfully! ✓");
        setIsVerifyModalOpen(false);
        return true;
      } else {
        toast.error(data?.error ?? "Verification failed. Please try again.");
        return false;
      }
    } catch {
      toast.error("Network error. Please try again.");
      return false;
    }
  }, []);

  return (
    <div className="space-y-6">
      <SettingsCard title="General profile">
        <form action={profileAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Name" name="name" defaultValue={user.name} required />
          <Field
            label="Username"
            name="username"
            defaultValue={user.username}
            required
          />

          {/* Phone field with verify button */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  +91
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-amber-400"
                  name="phone"
                  type="tel"
                  maxLength={10}
                  defaultValue={user.phone ?? ""}
                  placeholder="98XXXXXXXX"
                />
              </div>

              {/* Verified badge or verify button */}
              {phoneVerified ? (
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Verified</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-300"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {currentPhone ? "Verify" : "Add & Verify"}
                </button>
              )}
            </div>

            {/* Status hint */}
            {!phoneVerified && (
              <div className="mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700">
                  Phone verification is required to submit blog posts.
                </p>
              </div>
            )}
          </div>

          <Field
            label="Avatar URL"
            name="image"
            type="url"
            defaultValue={user.image}
          />
          <div className="md:col-span-2">
            <Field
              label="Cover image URL"
              name="coverImage"
              type="url"
              defaultValue={user.coverImage}
            />
          </div>
          <div className="flex items-center gap-4 md:col-span-2">
            <SubmitButton />
            <ActionMessage state={profileState} />
          </div>
        </form>
      </SettingsCard>

      {/* Student profile section */}
      <SettingsCard title="Student profile">
        <form action={studentAction} className="space-y-4">
          <Toggle
            name="enabled"
            label="Enable public student profile"
            defaultChecked={student?.isVisible ?? Boolean(student)}
          />
          <Field label="Headline" name="headline" defaultValue={student?.headline} />
          <TextArea label="Bio" name="bio" defaultValue={student?.bio} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Target exam"
              name="targetExam"
              defaultValue={student?.targetExam}
            />
            <Field
              label="Current class"
              name="currentClass"
              defaultValue={student?.currentClass}
            />
          </div>
          <p className="text-sm text-slate-500">
            Institute-specific courses and batches are read-only here. Manage them
            at the institute.
          </p>
          <div className="flex items-center gap-4">
            <SubmitButton />
            <ActionMessage state={studentState} />
          </div>
        </form>
      </SettingsCard>

      {/* Teacher profile section */}
      <SettingsCard title="Teacher profile">
        <form action={teacherAction} className="space-y-4">
          <Toggle
            name="enabled"
            label="Enable public teacher profile"
            defaultChecked={teacher?.isVisible ?? Boolean(teacher)}
          />
          <Field label="Headline" name="headline" defaultValue={teacher?.headline} />
          <TextArea label="Bio" name="bio" defaultValue={teacher?.bio} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Qualification"
              name="qualification"
              defaultValue={teacher?.qualification}
            />
            <Field
              label="Experience"
              name="experience"
              defaultValue={teacher?.experience}
            />
            <Field
              label="Subjects (comma separated)"
              name="subjects"
              defaultValue={teacher?.subjects.join(", ")}
            />
            <Field
              label="Languages (comma separated)"
              name="languages"
              defaultValue={teacher?.languages.join(", ")}
            />
          </div>
          <p className="text-sm text-slate-500">
            Designations and institute subjects remain attached to memberships,
            not this global identity.
          </p>
          <div className="flex items-center gap-4">
            <SubmitButton />
            <ActionMessage state={teacherState} />
          </div>
        </form>
      </SettingsCard>

      {/* Phone OTP Verification Modal */}
      <PhoneOtpModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onVerified={handleVerified}
        defaultPhone={currentPhone}
        title="Verify Your Phone"
        subtitle="Enter your mobile number to receive a verification code via SMS."
      />
    </div>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className={inputClass}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        className={inputClass}
        name={name}
        rows={4}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 accent-amber-500"
      />
      {label}
    </label>
  );
}
