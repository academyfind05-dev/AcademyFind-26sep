import Link from "next/link";
import { Bell, Paperclip, Pin, ChevronRight, Megaphone, Sparkles, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NOTICE_CATEGORY_META, NOTICE_PRIORITY_META } from "@/components/notices/notice-meta";
import { NoticeCategory, NoticePriority } from "@/app/generated/prisma/client";

interface PublicNotice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  priority: NoticePriority;
  isPinned: boolean;
  expiresAt?: Date | string | null;
  attachmentUrl?: string | null;
  createdAt: Date | string;
  author?: { name?: string | null; image?: string | null };
}

interface NoticeBoardSectionProps {
  notices: PublicNotice[];
  instituteName: string;
  instituteSlug: string;
  totalCount?: number;
}

export function NoticeBoardSection({
  notices,
  instituteName,
  instituteSlug,
  totalCount = 0,
}: NoticeBoardSectionProps) {
  if (notices.length === 0) return null;

  const displayNotices = notices.slice(0, 5);
  const hasMore = totalCount > 5;

  return (
    <section
      id="notice-board"
      className="scroll-mt-28 rounded-[2.5rem] bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-6 md:p-8 border-2 border-amber-300/80 shadow-xl shadow-amber-500/10 relative overflow-hidden transition-all duration-300"
    >
      {/* Ambient Decorative Backdrops */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-amber-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white/95 px-3 py-0.5 text-xs font-bold text-amber-900 shadow-2xs">
              <Megaphone className="w-3.5 h-3.5 text-amber-600" />
              Official Notice Board
            </div>
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
              {totalCount || notices.length} {totalCount === 1 ? "Notice" : "Notices"}
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Latest Announcements
            <Sparkles className="w-4 h-4 text-amber-500 hidden sm:inline" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Important updates, circulars, and schedules from {instituteName}
          </p>
        </div>

        {hasMore && (
          <Link
            href={`/institute/${instituteSlug}/notices`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 bg-amber-100/80 hover:bg-amber-200/80 px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-2xs shrink-0 self-start sm:self-auto"
          >
            View all ({totalCount})
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Notices List */}
      <div className="relative z-10 space-y-3.5">
        {displayNotices.map((notice) => {
          const cat = NOTICE_CATEGORY_META[notice.category] || {
            label: notice.category,
            color: "text-slate-700",
            bg: "bg-slate-100",
            border: "border-slate-200",
          };
          const pri = NOTICE_PRIORITY_META[notice.priority] || {
            label: notice.priority,
            dot: "bg-slate-400",
            pulse: false,
          };
          const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();

          return (
            <div
              key={notice.id}
              className={`
                group relative overflow-hidden rounded-2xl border
                bg-white/95 backdrop-blur-md p-5
                shadow-xs
                transition-all duration-300
                hover:shadow-lg hover:shadow-amber-500/10
                hover:-translate-y-1
                ${
                  notice.isPinned
                    ? "border-amber-400/90 bg-amber-50/50 shadow-amber-500/5 ring-1 ring-amber-300/50"
                    : "border-slate-200/90 hover:border-amber-300"
                }
                ${isExpired ? "opacity-60" : ""}
              `}
            >
              {/* Pinned left accent bar */}
              {notice.isPinned && (
                <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b from-amber-500 via-orange-500 to-amber-500" />
              )}

              <div className={notice.isPinned ? "pl-2" : ""}>
                <div className="flex items-start gap-3.5">
                  {/* Priority dot / Icon */}
                  <div className="shrink-0 mt-1">
                    <span
                      className={`block w-3 h-3 rounded-full ${pri.dot} ${
                        pri.pulse ? "animate-ping" : ""
                      }`}
                      title={`Priority: ${pri.label}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${cat.bg} ${cat.color} ${cat.border}`}
                      >
                        {cat.label}
                      </span>

                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                          <Pin className="w-3 h-3 fill-amber-500 text-amber-600" /> Pinned
                        </span>
                      )}

                      {notice.priority === "CRITICAL" && (
                        <span className="inline-flex items-center text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide">
                          Urgent Notice
                        </span>
                      )}

                      <span className="text-[11px] font-medium text-slate-400 ml-auto">
                        {formatDistanceToNow(new Date(notice.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-amber-800 transition-colors">
                      {notice.title}
                    </h3>

                    {/* Body */}
                    <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-wrap">
                      {notice.body}
                    </p>

                    {/* Footer / Attachment */}
                    {notice.attachmentUrl && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <a
                          href={notice.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-200 transition-all hover:scale-102"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                          View Attachment
                          <ExternalLink className="w-3 h-3 text-amber-500" />
                        </a>

                        {notice.author?.name && (
                          <span className="text-[11px] text-slate-400">
                            Posted by {notice.author.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA to Full Board */}
      <div className="relative z-10 mt-6 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-xs text-slate-500">
          Showing recent active notices. Click below to view circular archive.
        </p>
        <Link
          href={`/institute/${instituteSlug}/notices`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 w-full sm:w-auto"
        >
          <Bell className="w-4 h-4" />
          Open Full Notice Board ({totalCount || notices.length})
        </Link>
      </div>
    </section>
  );
}
