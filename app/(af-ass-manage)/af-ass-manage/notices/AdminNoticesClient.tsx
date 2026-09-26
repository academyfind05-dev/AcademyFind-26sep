"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  Pin,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Building2,
  Calendar,
  User,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { NOTICE_CATEGORY_META, NOTICE_PRIORITY_META, NOTICE_VISIBILITY_META } from "@/components/notices/notice-meta";
import { adminToggleNoticeActive, adminToggleNoticePin, adminDeleteNoticePermanently } from "./actions";

export interface AdminNoticeItem {
  id: string;
  title: string;
  body: string;
  category: any;
  priority: any;
  visibility: any;
  isPinned: boolean;
  isActive: boolean;
  expiresAt: Date | string | null;
  attachmentUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  institute: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

interface AdminNoticesClientProps {
  initialNotices: AdminNoticeItem[];
}

export function AdminNoticesClient({ initialNotices }: AdminNoticesClientProps) {
  const [notices, setNotices] = useState<AdminNoticeItem[]>(initialNotices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [selectedNotice, setSelectedNotice] = useState<AdminNoticeItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      // Status filter
      if (statusFilter === "ACTIVE" && !n.isActive) return false;
      if (statusFilter === "DELETED" && n.isActive) return false;

      // Category filter
      if (categoryFilter !== "ALL" && n.category !== categoryFilter) return false;

      // Priority filter
      if (priorityFilter !== "ALL" && n.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesInstitute = n.institute.name.toLowerCase().includes(q);
        const matchesAuthor = n.author?.name?.toLowerCase().includes(q) || false;
        const matchesBody = n.body.toLowerCase().includes(q);
        if (!matchesTitle && !matchesInstitute && !matchesAuthor && !matchesBody) return false;
      }

      return true;
    });
  }, [notices, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  const handleToggleActive = (notice: AdminNoticeItem) => {
    const newActiveState = !notice.isActive;
    setNotices((prev) =>
      prev.map((item) => (item.id === notice.id ? { ...item, isActive: newActiveState } : item))
    );

    startTransition(async () => {
      const res = await adminToggleNoticeActive(notice.id, notice.isActive);
      if (res.success) {
        toast.success(newActiveState ? "Notice restored" : "Notice soft-deleted");
      } else {
        // Revert
        setNotices((prev) =>
          prev.map((item) => (item.id === notice.id ? { ...item, isActive: notice.isActive } : item))
        );
        toast.error(res.error || "Failed to update notice");
      }
    });
  };

  const handleTogglePin = (notice: AdminNoticeItem) => {
    const newPinState = !notice.isPinned;
    setNotices((prev) =>
      prev.map((item) => (item.id === notice.id ? { ...item, isPinned: newPinState } : item))
    );

    startTransition(async () => {
      const res = await adminToggleNoticePin(notice.id, notice.isPinned);
      if (res.success) {
        toast.success(newPinState ? "Notice pinned to top" : "Notice unpinned");
      } else {
        setNotices((prev) =>
          prev.map((item) => (item.id === notice.id ? { ...item, isPinned: notice.isPinned } : item))
        );
        toast.error(res.error || "Failed to update pin state");
      }
    });
  };

  const handlePermanentDelete = (noticeId: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY remove this notice from the database? This cannot be undone.")) {
      return;
    }

    setNotices((prev) => prev.filter((item) => item.id !== noticeId));
    if (selectedNotice?.id === noticeId) setSelectedNotice(null);

    startTransition(async () => {
      const res = await adminDeleteNoticePermanently(noticeId);
      if (res.success) {
        toast.success("Notice permanently deleted");
      } else {
        toast.error(res.error || "Failed to delete notice");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by notice title, institute, or author..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full md:w-auto self-stretch">
            {(["ALL", "ACTIVE", "DELETED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {status === "ALL" ? "All Notices" : status === "ACTIVE" ? "Active" : "Soft Deleted"}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters: Category & Priority */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          <span className="text-xs font-semibold text-stone-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">All Categories</option>
            {Object.keys(NOTICE_CATEGORY_META).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">All Priorities</option>
            {Object.keys(NOTICE_PRIORITY_META).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-800">{filteredNotices.length}</strong> notice{filteredNotices.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Notices Table */}
      {filteredNotices.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-stone-200">
          <ShieldAlert className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No notices found</p>
          <p className="text-xs text-slate-400 mt-1">Try changing your search terms or filter settings</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3 px-4">Institute</th>
                <th className="py-3 px-4">Notice Title & Category</th>
                <th className="py-3 px-4">Priority & Visibility</th>
                <th className="py-3 px-4">Author & Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredNotices.map((n) => {
                const catMeta = NOTICE_CATEGORY_META[n.category as keyof typeof NOTICE_CATEGORY_META] || {
                  label: n.category,
                  color: "text-slate-700",
                  bg: "bg-slate-100",
                  border: "border-slate-200",
                };
                const priMeta = NOTICE_PRIORITY_META[n.priority as keyof typeof NOTICE_PRIORITY_META] || {
                  label: n.priority,
                  dot: "bg-slate-400",
                  pulse: false,
                };
                const visMeta = NOTICE_VISIBILITY_META[n.visibility as keyof typeof NOTICE_VISIBILITY_META] || {
                  label: n.visibility,
                  icon: "🌐",
                };

                return (
                  <tr
                    key={n.id}
                    className={`hover:bg-amber-50/30 transition-colors ${
                      !n.isActive ? "opacity-60 bg-stone-50/50" : ""
                    }`}
                  >
                    {/* Institute */}
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <Link
                          href={`/institute/${n.institute.slug}`}
                          target="_blank"
                          className="hover:text-amber-600 transition-colors truncate font-semibold"
                          title={n.institute.name}
                        >
                          {n.institute.name}
                        </Link>
                      </div>
                      <Link
                        href={`/manager/${n.institute.id}/notices`}
                        target="_blank"
                        className="text-[10px] text-stone-400 hover:text-amber-600 inline-flex items-center gap-0.5 mt-0.5"
                      >
                        Manager Board <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </td>

                    {/* Notice Title */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        {n.isPinned && (
                          <span
                            title="Pinned to top"
                            className="bg-amber-100 text-amber-800 p-1 rounded-md shrink-0"
                          >
                            <Pin className="w-3 h-3 fill-amber-500 text-amber-600" />
                          </span>
                        )}
                        <span className="font-semibold text-slate-900 truncate block" title={n.title}>
                          {n.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
                        >
                          {catMeta.label}
                        </span>
                        {n.attachmentUrl && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Paperclip className="w-2.5 h-2.5" /> Attached
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Priority & Visibility */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${priMeta.dot} ${
                            priMeta.pulse ? "animate-ping" : ""
                          }`}
                        />
                        <span className="font-medium text-slate-700 capitalize">{priMeta.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {visMeta.icon} {visMeta.label}
                      </span>
                    </td>

                    {/* Author & Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">{n.author?.name || "Manager"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {n.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-500" /> Soft Deleted
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Preview */}
                        <button
                          onClick={() => setSelectedNotice(n)}
                          title="Preview notice details"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Pin */}
                        <button
                          onClick={() => handleTogglePin(n)}
                          title={n.isPinned ? "Unpin notice" : "Pin notice"}
                          disabled={isPending}
                          className={`p-1.5 rounded-lg transition-colors ${
                            n.isPinned
                              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          }`}
                        >
                          <Pin className={`w-3.5 h-3.5 ${n.isPinned ? "fill-amber-500" : ""}`} />
                        </button>

                        {/* Soft Delete / Restore */}
                        <button
                          onClick={() => handleToggleActive(n)}
                          title={n.isActive ? "Soft delete notice" : "Restore notice"}
                          disabled={isPending}
                          className={`p-1.5 rounded-lg transition-colors ${
                            n.isActive
                              ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                              : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                        >
                          {n.isActive ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>

                        {/* Hard Delete */}
                        <button
                          onClick={() => handlePermanentDelete(n.id)}
                          title="Permanently delete from database"
                          disabled={isPending}
                          className="p-1.5 text-stone-300 hover:text-red-700 hover:bg-red-100/60 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Dialog Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {selectedNotice.institute.name}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedNotice.title}</h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Category: <strong>{selectedNotice.category}</strong></span>
              <span>•</span>
              <span>Priority: <strong>{selectedNotice.priority}</strong></span>
              <span>•</span>
              <span>Visibility: <strong>{selectedNotice.visibility}</strong></span>
              <span>•</span>
              <span>
                Posted: {format(new Date(selectedNotice.createdAt), "MMM d, yyyy h:mm a")}
              </span>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {selectedNotice.body}
            </div>

            {selectedNotice.attachmentUrl && (
              <div className="pt-2">
                <a
                  href={selectedNotice.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" /> View Attachment
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
              <span className="text-slate-400">Author: {selectedNotice.author?.name || "Institute Staff"}</span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
