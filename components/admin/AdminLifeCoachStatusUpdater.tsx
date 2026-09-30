"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Save, UserCheck } from "lucide-react";
import { updateLifeCoachStatus, assignLifeCoachToSalesManager } from "@/lib/User/admin/adminLifeCoachStatus";

interface StatusUpdaterProps {
  requestId: string;
  currentStatus: "PENDING" | "CONTACTED" | "MESSAGED" | "CALLED" | "RESOLVED" | "JUNK" | "DNP";
  currentNotes?: string | null;
  salesManagerNote?: string | null;
  assignedSalesManagerId?: string | null;
  salesManagers?: { id: string; name: string | null; email: string | null }[];
  lastUpdatedByName?: string | null;
  lastUpdatedByRole?: string | null;
  isSalesManager?: boolean;
}

export default function StatusUpdater({
  requestId,
  currentStatus,
  currentNotes,
  salesManagerNote,
  assignedSalesManagerId,
  salesManagers = [],
  lastUpdatedByName,
  lastUpdatedByRole,
  isSalesManager = false,
}: StatusUpdaterProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes || "");
  const [smNote, setSmNote] = useState(salesManagerNote || "");

  const [selectedSalesManager, setSelectedSalesManager] = useState(assignedSalesManagerId || "");
  const [assigningSalesManager, setAssigningSalesManager] = useState(false);

  const handleUpdate = async (newStatus?: typeof currentStatus) => {
    const statusToUpdate = newStatus || status;
    setLoading(true);
    if (newStatus) setStatus(newStatus);

    const res = await updateLifeCoachStatus(
      requestId,
      statusToUpdate,
      isSalesManager ? undefined : notes,
      isSalesManager ? smNote : undefined
    );

    if (res.success) {
      toast.success(res.message || "Updated successfully");
    } else {
      toast.error(res.error || "Failed to update");
      if (newStatus) setStatus(currentStatus);
    }

    setLoading(false);
  };

  const handleAssignSalesManager = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newManagerId = e.target.value;
    setSelectedSalesManager(newManagerId);
    setAssigningSalesManager(true);
    const res = await assignLifeCoachToSalesManager(requestId, newManagerId || null);
    if (res.success) {
      toast.success(newManagerId ? "Assigned to Sales Manager!" : "Request unassigned");
    } else {
      toast.error(res.error || "Failed to assign");
    }
    setAssigningSalesManager(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 🚀 Admin Assignment Control (hidden for Sales Manager) */}
      {!isSalesManager && salesManagers.length > 0 && (
        <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">Assign to Sales Manager</p>
              <p className="text-[11px] text-indigo-600">Sales manager will see full request details & follow up</p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <select
              value={selectedSalesManager}
              onChange={handleAssignSalesManager}
              disabled={assigningSalesManager}
              className="w-full sm:w-auto bg-white border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="">Unassigned</option>
              {salesManagers.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name || sm.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Status Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase">Status:</label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => handleUpdate(e.target.value as any)}
              disabled={loading}
              className={`appearance-none pl-4 pr-8 py-2 rounded-xl text-sm font-bold uppercase tracking-wider outline-none cursor-pointer border transition-all ${
                status === "PENDING"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : status === "CONTACTED"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : status === "MESSAGED"
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : status === "CALLED"
                  ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                  : status === "RESOLVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : status === "JUNK"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-slate-100 text-slate-700 border-slate-300" // DNP
              } disabled:opacity-50`}
            >
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="MESSAGED">Messaged</option>
              <option value="CALLED">Called</option>
              <option value="RESOLVED">Resolved</option>
              <option value="JUNK">Junk</option>
              <option value="DNP">DNP (Did Not Pick)</option>
            </select>

            {loading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 opacity-70" />
            )}
          </div>
        </div>

        {lastUpdatedByName && (
          <p className="text-[11px] text-slate-500 italic">
            Last updated by: <strong>{lastUpdatedByName}</strong> (
            {lastUpdatedByRole === "SALES_MANAGER" ? "Sales Manager" : "Admin"})
          </p>
        )}
      </div>

      {/* Notes Area */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase">
          {isSalesManager ? "Sales Manager Notes:" : "Admin Notes:"}
        </label>
        <div className="relative">
          <textarea
            value={isSalesManager ? smNote : notes}
            onChange={(e) => (isSalesManager ? setSmNote(e.target.value) : setNotes(e.target.value))}
            placeholder="Add internal notes, follow-up summary, or counseling outcome..."
            className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 resize-none transition-all"
          />
          <button
            onClick={() => handleUpdate()}
            disabled={loading}
            className="absolute bottom-3 right-3 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
            title="Save Notes"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}