import { NoticeCategory, NoticePriority } from "@/app/generated/prisma/client";

// ─── Category Meta ─────────────────────────────────────────────────────────────
export const NOTICE_CATEGORY_META: Record<
  NoticeCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  GENERAL:   { label: "General",   color: "text-slate-700",  bg: "bg-slate-100",   border: "border-slate-200" },
  EXAM:      { label: "Exam",      color: "text-amber-800",  bg: "bg-amber-100",   border: "border-amber-200" },
  HOLIDAY:   { label: "Holiday",   color: "text-emerald-800",bg: "bg-emerald-100", border: "border-emerald-200" },
  FEE:       { label: "Fee",       color: "text-orange-800", bg: "bg-orange-100",  border: "border-orange-200" },
  RESULT:    { label: "Result",    color: "text-blue-800",   bg: "bg-blue-100",    border: "border-blue-200" },
  EVENT:     { label: "Event",     color: "text-purple-800", bg: "bg-purple-100",  border: "border-purple-200" },
  ADMISSION: { label: "Admission", color: "text-teal-800",   bg: "bg-teal-100",    border: "border-teal-200" },
  URGENT:    { label: "Urgent",    color: "text-red-800",    bg: "bg-red-100",     border: "border-red-200" },
};

// ─── Priority Meta ─────────────────────────────────────────────────────────────
export const NOTICE_PRIORITY_META: Record<
  NoticePriority,
  { label: string; dot: string; pulse: boolean }
> = {
  LOW:      { label: "Low",      dot: "bg-slate-300",  pulse: false },
  NORMAL:   { label: "Normal",   dot: "bg-sky-400",    pulse: false },
  HIGH:     { label: "High",     dot: "bg-orange-400", pulse: false },
  CRITICAL: { label: "Critical", dot: "bg-red-500",    pulse: true  },
};

// ─── Visibility Meta ───────────────────────────────────────────────────────────
export const NOTICE_VISIBILITY_META = {
  PUBLIC:       { label: "Public",        icon: "🌐", desc: "Visible to everyone on the institute page" },
  MEMBERS_ONLY: { label: "Members Only",  icon: "👥", desc: "Only active students & teachers can see this" },
  STAFF_ONLY:   { label: "Staff Only",    icon: "🔒", desc: "Only teachers and managers can see this" },
};

export type NoticeCategoryType = NoticeCategory;
export type NoticePriorityType = NoticePriority;
