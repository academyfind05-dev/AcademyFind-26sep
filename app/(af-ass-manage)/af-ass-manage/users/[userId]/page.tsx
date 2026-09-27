import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Clock, ShieldAlert, ArrowLeft, History, Star, Building2, FileText } from "lucide-react";
import AdminUserEditForm from "@/components/admin/AdminUserEditForm";
import ManagerControl from "@/components/admin/AdminManagerControls"; 
import { AdminMessageUserButton } from "@/components/admin/AdminUserClientControl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function UserDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    // 1. Fetch User with all relations
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            managedInstitutes: { include: { institute: true } },
            instituteRequests: { orderBy: { createdAt: 'desc' } }, // 🚀 Requests fetch (Ordered by latest)
            claims: { orderBy: { createdAt: 'desc' } },
            reviews: { include: { institute: { select: { name: true } } } },
            viewHistory: { 
                include: { institute: { select: { name: true } } },
                orderBy: { viewedAt: 'desc' },
                take: 10
            },
            shortlisted: { include: { institute: { select: { name: true } } } }
        }
    });

    if (!user) notFound();

    // 2. Fetch ALL Institutes for the assignment dropdown (Lightweight fetch)
    const allInstitutes = await prisma.institute.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="w-full space-y-6 pb-12 font-sans">
            
            <Link href="/af-ass-manage/users" className="inline-flex items-center text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to User Directory
            </Link>

            {/* Header Profile Card */}
            <Card className="border-stone-200 shadow-sm overflow-hidden bg-white relative">
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-24 h-24 rounded-full border-4 border-stone-50 bg-stone-100 overflow-hidden shrink-0 shadow-sm">
                        {user.image ? (
                            <Image src={user.image} alt={user.name || "User"} width={96} height={96} className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-stone-400">
                                {user.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left z-10 pt-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900">{user.name || "Unknown User"}</h1>
                            <Badge variant="outline" className="bg-stone-100 text-stone-700 border-stone-200 uppercase tracking-wider font-bold shadow-none">
                                {user.role}
                            </Badge>
                            <div className="ml-auto flex items-center">
                                <AdminMessageUserButton userId={user.id} userName={user.name || undefined} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-stone-500 font-medium">
                            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-stone-400" /> {user.email}</span>
                            <span className="flex items-center gap-1.5"><ShieldAlert className={`w-4 h-4 ${user.emailVerified ? "text-emerald-500" : "text-amber-500"}`} /> {user.emailVerified ? "Verified Email" : "Unverified Email"}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-stone-400" /> Joined: {new Date(user.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-stone-400" /> Last Active: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "Never"}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN: EDIT FORM & REQUESTS */}
                <div className="lg:col-span-2 space-y-6">
                    <AdminUserEditForm user={user} allInstitutes={allInstitutes} />

                    {/* Summary Boxes */}
                    <Card className="border-stone-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-stone-500" /> Requests Summary
                            </CardTitle>
                        </CardHeader>
                        <Separator className="bg-stone-100" />
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl">
                                    <div className="text-stone-500 font-bold text-xs uppercase tracking-wider mb-1">Listing Requests</div>
                                    <div className="text-2xl font-black text-stone-800">{user.instituteRequests.length}</div>
                                </div>
                                <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl">
                                    <div className="text-stone-500 font-bold text-xs uppercase tracking-wider mb-1">Ownership Claims</div>
                                    <div className="text-2xl font-black text-stone-800">{user.claims.length}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 🚀 NAYA SECTION: Detailed Institute Requests List */}
                    <Card className="border-stone-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-stone-500" /> Institute Listing Requests
                            </CardTitle>
                        </CardHeader>
                        <Separator className="bg-stone-100" />
                        <CardContent className="pt-6">
                            {user.instituteRequests.length > 0 ? (
                                <ul className="space-y-3">
                                    {user.instituteRequests.map((req) => (
                                        <li key={req.id} className="p-4 bg-stone-50 border border-stone-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-stone-100/50 transition-colors">
                                            <div>
                                                <div className="font-bold text-stone-800 text-base">{req.id}</div>
                                                <div className="text-xs text-stone-500 font-medium mt-1">
                                                    Institute: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200">{req.instituteId}</span>
                                                </div>
                                                <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Submitted on {new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            
                                            {/* Status Badge */}
                                            <Badge variant="outline" className={`shrink-0 shadow-none font-bold tracking-wider ${
                                                req.status === 'PENDING' ? 'bg-stone-200 text-stone-700 border-stone-300' :
                                                req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                'bg-rose-100 text-rose-700 border-rose-200'
                                            }`}>
                                                {req.status}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-stone-400 p-6 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                                    This user has not submitted any institute listing requests.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: DATA OVERVIEW & MANAGER CONTROL */}
                <div className="space-y-6">
                    
                    <ManagerControl 
                        userId={user.id} 
                        managedInstitutes={user.managedInstitutes} 
                        allInstitutes={allInstitutes} 
                    />

                    {/* Recent View History */}
                    <Card className="border-stone-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <History className="w-4 h-4 text-stone-500" /> Recent Browsing
                            </CardTitle>
                        </CardHeader>
                        <Separator className="bg-stone-100" />
                        <CardContent className="pt-4 p-4">
                            {user.viewHistory.length > 0 ? (
                                <ul className="space-y-2">
                                    {user.viewHistory.map((history) => (
                                        <li key={history.id} className="text-xs p-2 bg-stone-50 border border-stone-100 rounded-lg flex justify-between">
                                            <span className="truncate flex-1 font-medium text-stone-700">{history.institute.name}</span>
                                            <span className="text-stone-400 shrink-0 ml-2">{new Date(history.viewedAt).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-xs text-stone-400 p-2 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">No view history found.</p>}
                        </CardContent>
                    </Card>

                    {/* Reviews */}
                    <Card className="border-stone-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Star className="w-4 h-4 text-stone-500" /> Reviews Given ({user.reviews.length})
                            </CardTitle>
                        </CardHeader>
                        <Separator className="bg-stone-100" />
                        <CardContent className="pt-4 p-4">
                            {user.reviews.length > 0 ? (
                                <ul className="space-y-2">
                                    {user.reviews.slice(0, 5).map((review) => (
                                        <li key={review.id} className="text-xs p-2 bg-stone-50 border border-stone-100 rounded-lg flex justify-between">
                                            <span className="truncate flex-1 font-medium text-stone-700">{review.institute.name}</span>
                                            <span className="font-bold text-stone-500 shrink-0 ml-2">★ {review.rating}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-xs text-stone-400 p-2 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">No reviews written.</p>}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}