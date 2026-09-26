import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Bell, Pin, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { AdminNoticesClient } from "./AdminNoticesClient";

export const metadata = {
  title: "Notice Board Moderation | Admin Control Panel",
  robots: { index: false, follow: false },
};

export const revalidate = 0;

export default async function AdminNoticesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [notices, totalCount, activeCount, pinnedCount, deletedCount] = await Promise.all([
    prisma.instituteNotice.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        institute: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, email: true, image: true } },
      },
      take: 150,
    }),
    prisma.instituteNotice.count(),
    prisma.instituteNotice.count({ where: { isActive: true } }),
    prisma.instituteNotice.count({ where: { isPinned: true, isActive: true } }),
    prisma.instituteNotice.count({ where: { isActive: false } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-700 rounded-2xl border border-amber-200/80">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notice Board Moderation</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
                <ShieldCheck className="w-3 h-3 text-amber-700" /> Platform Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monitor, pin, soft-delete, or restore announcements posted by academies across the platform.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">Total Notices</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{activeCount}</span>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
            <Pin className="w-3.5 h-3.5" /> Pinned
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{pinnedCount}</span>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Soft Deleted
          </span>
          <span className="text-2xl font-black text-red-700 mt-1 block">{deletedCount}</span>
        </div>
      </div>

      {/* Interactive Table with Search & Filters */}
      <AdminNoticesClient initialNotices={notices} />
    </div>
  );
}
