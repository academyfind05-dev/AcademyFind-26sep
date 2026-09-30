import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatIST, formatWhatsAppNumber } from "@/lib/utils";
import { Compass, Eye, Calendar, User, Phone, Filter, MessageCircle, Mail, Clock } from "lucide-react";
import { buildLifeCoachWhatsAppMessage } from "@/lib/notifications/lifeCoachTemplates";

const getStatusBadgeClass = (s: string) => {
  switch (s) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "CONTACTED":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "MESSAGED":
      return "bg-teal-50 text-teal-700 border border-teal-200";
    case "CALLED":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "JUNK":
      return "bg-red-50 text-red-700 border border-red-200";
    case "DNP":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-300";
  }
};

export default async function SalesManagerLifeCoachPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const currentFilter = sp.status || "ALL";
  const search = sp.search || "";

  const whereCondition: any = {
    assignedSalesManagerId: id,
  };

  if (currentFilter !== "ALL") {
    whereCondition.status = currentFilter;
  }

  if (search.trim()) {
    whereCondition.OR = [
      { fullName: { contains: search.trim(), mode: "insensitive" } },
      { phone: { contains: search.trim() } },
      { email: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const [requests, totalCount, pendingCount] = await Promise.all([
    prisma.lifeCoachRequest.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    }),
    prisma.lifeCoachRequest.count({
      where: { assignedSalesManagerId: id },
    }),
    prisma.lifeCoachRequest.count({
      where: { assignedSalesManagerId: id, status: "PENDING" },
    }),
  ]);

  const filterOptions = [
    { label: "All Requests", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Contacted", value: "CONTACTED" },
    { label: "Messaged", value: "MESSAGED" },
    { label: "Called", value: "CALLED" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Junk", value: "JUNK" },
    { label: "DNP", value: "DNP" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Compass className="w-6 h-6" />
            </div>
            Assigned Life Coach Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Student counseling and mentorship requests assigned to you by Admin. Connect with students, offer guidance, and track status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl font-bold text-xs">
              {pendingCount} Pending Action
            </span>
          )}
          <div className="bg-indigo-50 text-indigo-800 border border-indigo-100 px-4 py-2 rounded-2xl font-bold text-sm shrink-0">
            Total Assigned: {totalCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filter Status:
        </div>
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            prefetch={false}
            href={`/sales_manager/${id}/life-coach?status=${opt.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentFilter === opt.value
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 scale-105"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Student Details</th>
                <th className="p-4">Counseling Dilemma</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Compass className="w-8 h-8 text-slate-300" />
                      <p>No Life Coach requests assigned to you under "{currentFilter}".</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatIST(req.createdAt, "dd MMM yyyy")}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 pl-5">
                          {formatIST(req.createdAt, "hh:mm a")}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" /> {req.fullName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {req.phone}
                      </div>
                      {req.email && (
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {req.email}
                        </div>
                      )}
                    </td>

                    <td className="p-4 max-w-[280px]">
                      {req.message ? (
                        <p className="text-xs text-slate-700 font-medium line-clamp-2" title={req.message}>
                          {req.message}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No specific query provided</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.phone && (
                          <a
                            href={`https://wa.me/${formatWhatsAppNumber(req.phone)}?text=${encodeURIComponent(
                              buildLifeCoachWhatsAppMessage({ fullName: req.fullName })
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                            title="WhatsApp Student"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        <Link
                          prefetch={false}
                          href={`/sales_manager/${id}/life-coach/${req.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
