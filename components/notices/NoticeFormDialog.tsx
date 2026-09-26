"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { NOTICE_CATEGORY_META, NOTICE_PRIORITY_META, NOTICE_VISIBILITY_META } from "./notice-meta";
import { createNotice, updateNotice } from "@/app/actions/notices";
import { NoticeCardData } from "./NoticeCard";

interface NoticeFormDialogProps {
  instituteId: string;
  open: boolean;
  editingNotice?: NoticeCardData | null;
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORIES = Object.entries(NOTICE_CATEGORY_META) as [string, typeof NOTICE_CATEGORY_META[keyof typeof NOTICE_CATEGORY_META]][];
const PRIORITIES = Object.entries(NOTICE_PRIORITY_META) as [string, typeof NOTICE_PRIORITY_META[keyof typeof NOTICE_PRIORITY_META]][];
const VISIBILITIES = Object.entries(NOTICE_VISIBILITY_META) as [string, typeof NOTICE_VISIBILITY_META[keyof typeof NOTICE_VISIBILITY_META]][];

const defaultForm = {
  title: "",
  body: "",
  category: "GENERAL",
  priority: "NORMAL",
  visibility: "PUBLIC",
  isPinned: false,
  expiresAt: "",
  attachmentUrl: "",
};

export function NoticeFormDialog({
  instituteId,
  open,
  editingNotice,
  onClose,
  onSaved,
}: NoticeFormDialogProps) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Populate form when editing
  useEffect(() => {
    if (editingNotice) {
      setForm({
        title: editingNotice.title,
        body: editingNotice.body,
        category: editingNotice.category,
        priority: editingNotice.priority,
        visibility: editingNotice.visibility ?? "PUBLIC",
        isPinned: editingNotice.isPinned,
        expiresAt: editingNotice.expiresAt
          ? new Date(editingNotice.expiresAt).toISOString().slice(0, 16)
          : "",
        attachmentUrl: editingNotice.attachmentUrl ?? "",
      });
    } else {
      setForm(defaultForm);
    }
    setError(null);
  }, [editingNotice, open]);

  if (!open) return null;

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      title: form.title,
      body: form.body,
      category: form.category as any,
      priority: form.priority as any,
      visibility: form.visibility as any,
      isPinned: form.isPinned,
      expiresAt: form.expiresAt || null,
      attachmentUrl: form.attachmentUrl || null,
    };

    startTransition(async () => {
      const res = editingNotice
        ? await updateNotice(editingNotice.id, payload)
        : await createNotice(instituteId, payload);

      if ("error" in res && res.error) {
        setError(res.error as string);
      } else {
        onSaved?.();
        onClose();
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] border border-slate-200/60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-5 bg-white/95 backdrop-blur-sm border-b border-slate-100 rounded-t-3xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  {editingNotice ? "Edit Notice" : "New Notice"}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {editingNotice ? "Update Notice" : "Post to Notice Board"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                maxLength={120}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="E.g. Exam schedule updated for batch 2025"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-400 text-right">
                {form.title.length}/120
              </p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                maxLength={5000}
                rows={5}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Write the full notice content here..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all resize-none"
              />
              <p className="mt-1 text-[11px] text-slate-400 text-right">
                {form.body.length}/5000
              </p>
            </div>

            {/* Category + Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all pr-9"
                  >
                    {CATEGORIES.map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Priority
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITIES.map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set("priority", key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        form.priority === key
                          ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${meta.dot} ${
                          meta.pulse ? "animate-pulse" : ""
                        }`}
                      />
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Visibility
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITIES.map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("visibility", key)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      form.visibility === key
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base mb-1">{meta.icon}</span>
                    <span
                      className={`text-xs font-bold ${
                        form.visibility === key ? "text-amber-900" : "text-slate-700"
                      }`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {meta.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pin + Expiry row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Expiry Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => set("expiresAt", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Attachment URL (optional)
                </label>
                <input
                  type="url"
                  value={form.attachmentUrl}
                  onChange={(e) => set("attachmentUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Pin toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`relative w-10 h-5.5 rounded-full transition-colors ${
                  form.isPinned ? "bg-amber-500" : "bg-slate-200"
                }`}
                onClick={() => set("isPinned", !form.isPinned)}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    form.isPinned ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  📌 Pin to top of notice board
                </p>
                <p className="text-[11px] text-slate-400">
                  Pinned notices appear at the top for everyone
                </p>
              </div>
            </label>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-5 h-10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm px-6 h-10 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingNotice ? "Save Changes" : "Post Notice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
