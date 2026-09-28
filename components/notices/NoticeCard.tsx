"use client";

import { useState, useTransition } from "react";
import { Pin, Pencil, Trash2, Paperclip, AlertCircle } from "lucide-react";
import { NoticeCategory, NoticePriority, NoticeVisibility } from "@/app/generated/prisma/client";
import { NOTICE_CATEGORY_META, NOTICE_PRIORITY_META, NOTICE_VISIBILITY_META } from "./notice-meta";
import { deleteNotice, pinNotice } from "@/app/actions/notices";
import { formatDistanceToNow } from "date-fns";

export interface NoticeCardData {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  priority: NoticePriority;
  isPinned: boolean;
  expiresAt?: Date | string | null;
  attachmentUrl?: string | null;
  createdAt: Date | string;
  visibility?: NoticeVisibility;
  author?: { name?: string | null; image?: string | null };
}

interface NoticeCardProps {
  notice: NoticeCardData;
  isManager?: boolean;
  onEdit?: (notice: NoticeCardData) => void;
  onDeleted?: (noticeId: string) => void;
  onPinToggle?: (noticeId: string, isPinned: boolean) => void;
}

export function NoticeCard({ notice, isManager, onEdit, onDeleted, onPinToggle }: NoticeCardProps) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [pinning, setPinning] = useState(false);

  const cat = NOTICE_CATEGORY_META[notice.category];
  const pri = NOTICE_PRIORITY_META[notice.priority];
  const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();

  if (deleted) return null;

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this notice? This action can be undone by an admin.")) return;
    startTransition(async () => {
      const res = await deleteNotice(notice.id);
      if (res.success) {
        setDeleted(true);
        onDeleted?.(notice.id);
      }
    });
  }

  function handlePin() {
    setPinning(true);
    const nextPinned = !notice.isPinned;
    onPinToggle?.(notice.id, nextPinned);
    startTransition(async () => {
      await pinNotice(notice.id, nextPinned);
      setPinning(false);
    });
  }

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border
        bg-white/80 backdrop-blur-md p-5
        shadow-[0_4px_20px_rgba(0,0,0,0.04)]
        transition-all duration-300 ease-out
        hover:shadow-[0_12px_35px_rgba(251,191,36,0.10)]
        hover:-translate-y-0.5
        ${notice.isPinned
          ? "border-amber-300/80 bg-amber-50/40 hover:border-amber-400"
          : "border-slate-200/70 hover:border-amber-300/60"
        }
        ${isExpired ? "opacity-60" : ""}
        ${isPending ? "pointer-events-none opacity-50" : ""}
      `}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-400/8 blur-xl group-hover:bg-amber-400/15 transition-all" />

      {/* Pinned bar */}
      {notice.isPinned && (
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-amber-400 to-orange-400" />
      )}

      <div className={notice.isPinned ? "ml-2" : ""}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority dot */}
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${pri.dot} ${
                pri.pulse ? "animate-pulse" : ""
              }`}
              title={`Priority: ${pri.label}`}
            />
            {/* Category badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cat.bg} ${cat.color} ${cat.border}`}
            >
              {cat.label}
            </span>
            {/* Visibility badge (manager only) */}
            {isManager && notice.visibility && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                {NOTICE_VISIBILITY_META[notice.visibility].icon}{" "}
                {NOTICE_VISIBILITY_META[notice.visibility].label}
              </span>
            )}
            {/* Pin indicator */}
            {notice.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
          </div>

          {/* Manager actions */}
          {isManager && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={handlePin}
                disabled={pinning}
                title={notice.isPinned ? "Unpin" : "Pin to top"}
                className={`p-1.5 rounded-lg transition-colors ${
                  notice.isPinned
                    ? "text-amber-600 bg-amber-100 hover:bg-amber-200"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit?.(notice)}
                title="Edit notice"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                title="Delete notice"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">
          {notice.title}
        </h3>

        {/* Body */}
        <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
          {notice.body}
        </p>

        {/* Expired warning */}
        {isExpired && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            This notice has expired
          </div>
        )}

        {/* Expiry countdown */}
        {notice.expiresAt && !isExpired && (
          <p className="mt-2 text-[11px] text-orange-600 font-medium">
            Expires in {formatDistanceToNow(new Date(notice.expiresAt))}
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
            {notice.author?.name && (
              <> · <span className="font-medium text-slate-500">{notice.author.name}</span></>
            )}
          </span>
          {notice.attachmentUrl && (
            <a
              href={notice.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              <Paperclip className="w-3 h-3" />
              Attachment
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
