import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, Clock, MessageSquare, MessageCircle, FileText, Compass, ShieldCheck } from "lucide-react";
import StatusUpdater from "@/components/admin/AdminLifeCoachStatusUpdater";
import { formatIST, formatWhatsAppNumber } from "@/lib/utils";
import { buildLifeCoachWhatsAppMessage } from "@/lib/notifications/lifeCoachTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/getSession";

export default async function SalesManagerLifeCoachDetailPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const isSalesManager = session.user.role === "SALES_MANAGER";
  const isAdmin = session.user.role === "ADMIN";

  if (!isSalesManager && !isAdmin) {
    redirect("/");
  }

  const request = await prisma.lifeCoachRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) notFound();

  // If viewing as sales manager, must be assigned to them
  if (isSalesManager && request.assignedSalesManagerId !== id && request.assignedSalesManagerId !== session.user.id) {
    redirect(`/sales_manager/${id}/life-coach`);
  }

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {/* Back Link */}
      <Link
        href={`/sales_manager/${id}/life-coach`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assigned Life Coach Requests
      </Link>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-3xl">
        {/* Header & Status + Notes Updater */}
        <CardHeader className="flex flex-col gap-6 bg-slate-50/70 pb-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Life Coach Student Request</CardTitle>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Assigned to You
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                Request ID: {request.id}
              </p>
            </div>
          </div>

          <StatusUpdater
            requestId={request.id}
            currentStatus={request.status as any}
            currentNotes={request.notes}
            salesManagerNote={request.salesManagerNote}
            assignedSalesManagerId={request.assignedSalesManagerId}
            lastUpdatedByName={request.lastUpdatedByName}
            lastUpdatedByRole={request.lastUpdatedByRole}
            isSalesManager={true}
          />
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Details</h3>

              <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-xs"><User className="w-4 h-4 text-slate-600" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Student Name</p>
                    <p className="font-semibold text-slate-800">{request.fullName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-xs"><Phone className="w-4 h-4 text-slate-600" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                    <a href={`tel:${request.phone}`} className="font-semibold text-emerald-700 hover:underline">{request.phone}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-xs"><Mail className="w-4 h-4 text-slate-600" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                    <a href={`mailto:${request.email}`} className="font-semibold text-blue-700 hover:underline">{request.email || "Not provided"}</a>
                  </div>
                </div>

                {request.phone && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <a
                      href={`https://wa.me/${formatWhatsAppNumber(request.phone)}?text=${encodeURIComponent(
                        buildLifeCoachWhatsAppMessage({ fullName: request.fullName })
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" /> Open WhatsApp with Official Template
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Query Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Counseling Dilemma</h3>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-800 text-sm">Student Message / Problem</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap flex-1 break-words">
                  {request.message ? (
                    request.message.split(/(https?:\/\/[^\s]+)/g).map((part: any, i: any) =>
                      /(https?:\/\/[^\s]+)/g.test(part) ? (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                          {part}
                        </a>
                      ) : (
                        part
                      )
                    )
                  ) : (
                    <span className="italic text-slate-400">No specific message provided. Please call the student to understand their query.</span>
                  )}
                </p>

                {request.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-purple-50/60 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                      <FileText className="w-3.5 h-3.5 text-purple-600" /> Admin Instructions / Notes:
                    </div>
                    <p className="text-xs text-purple-950 whitespace-pre-wrap">{request.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Requested on {formatIST(request.createdAt)}
            </div>
            {request.updatedAt && (
              <span className="text-[11px] text-slate-400">
                Last modified: {formatIST(request.updatedAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
