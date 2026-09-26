"use client";

import { useState, useOptimistic, useCallback } from "react";
import { Bell, Plus, FileText, AlertTriangle } from "lucide-react";
import { NoticeCard, NoticeCardData } from "@/components/notices/NoticeCard";
import { NoticeFormDialog } from "@/components/notices/NoticeFormDialog";
import { NOTICE_CATEGORY_META } from "@/components/notices/notice-meta";
import { NoticeCategory } from "@/app/generated/prisma/client";

interface Props {
  instituteId: string;
  instituteName: string;
  initialNotices: NoticeCardData[];
}

type FilterCategory = "ALL" | NoticeCategory;

export function NoticeBoardManager({ instituteId, instituteName, initialNotices }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeCardData | null>(null);
  const [notices, setNotices] = useState<NoticeCardData[]>(initialNotices);
  const [filter, setFilter] = useState<FilterCategory>("ALL");

  const filtered =
    filter === "ALL"
      ? notices
      : notices.filter((n) => n.category === filter);

  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  const handleEdit = useCallback((notice: NoticeCardData) => {
    setEditingNotice(notice);
    setDialogOpen(true);
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleNewClick = () => {
    setEditingNotice(null);
    setDialogOpen(true);
  };

  // After save, reload from server via full page re-render (revalidatePath handles it)
  const handleSaved = () => {
    // Close dialog — Next.js revalidatePath in the action will refresh the page
    setDialogOpen(false);
    setEditingNotice(null);
  };

  const filterCategories: { key: FilterCategory; label: string }[] = [
    { key: "ALL", label: "All" },
    ...Object.entries(NOTICE_CATEGORY_META).map(([key, meta]) => ({
      key: key as NoticeCategory,
      label: meta.label,
    })),
  ];

  return (
    <div className="space-y-7">
      {/* ─── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/90 px-3.5 py-1 text-xs font-semibold text-amber-800 shadow-2xs backdrop-blur-xs mb-3">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Notice Board
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Manage{" "}
            <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 bg-clip-text text-transparent">
              Notices
            </span>
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Post announcements, exam schedules, fee reminders and more to{" "}
            <span className="font-semibold text-stone-700">{instituteName}</span>.
            Active members are notified automatically.
          </p>
        </div>
        <button
          onClick={handleNewClick}
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm px-5 h-10 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Post Notice
        </button>
      </div>

      {/* ─── Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Notices",
            value: notices.length,
            icon: <FileText className="w-5 h-5" />,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Pinned",
            value: notices.filter((n) => n.isPinned).length,
            icon: <Bell className="w-5 h-5" />,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Urgent",
            value: notices.filter((n) => n.category === "URGENT").length,
            icon: <AlertTriangle className="w-5 h-5" />,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md p-4 flex items-center gap-3 shadow-[0_4px_15px_rgba(0,0,0,0.03)]"
          >
            <div
              className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-extrabold text-stone-900">{stat.value}</p>
              <p className="text-xs text-stone-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filter Bar ───────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {filterCategories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === key
                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Empty State ──────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-400 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">
            {filter === "ALL" ? "No notices yet" : `No ${NOTICE_CATEGORY_META[filter as NoticeCategory]?.label} notices`}
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mb-5">
            {filter === "ALL"
              ? "Post your first notice to keep students and teachers informed."
              : "Try a different filter or post a new notice in this category."}
          </p>
          <button
            onClick={handleNewClick}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm px-5 h-9 shadow-md shadow-amber-200 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Post First Notice
          </button>
        </div>
      )}

      {/* ─── Pinned Notices ───────────────────────────────────────── */}
      {pinned.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
            Pinned
            <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pinned.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                isManager
                onEdit={handleEdit}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── All Notices ──────────────────────────────────────────── */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-slate-200 rounded-full" />
              Other Notices
              <span className="w-4 h-0.5 bg-slate-200 rounded-full" />
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {unpinned.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                isManager
                onEdit={handleEdit}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Dialog ───────────────────────────────────────────────── */}
      <NoticeFormDialog
        instituteId={instituteId}
        open={dialogOpen}
        editingNotice={editingNotice}
        onClose={() => {
          setDialogOpen(false);
          setEditingNotice(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
