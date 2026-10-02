import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import { Search, MapPin, Briefcase, ArrowRight, Building2, Sparkles, ArrowBigDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// ─── 1. METADATA ─────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Careers at AcademyFind | Join Our Mission",
  description: "Explore exciting career opportunities at AcademyFind. Join our team and help millions of students discover the best education across India.",
  alternates: {
    canonical: "https://academyfind.com/careers",
  },
  openGraph: {
    title: "Careers at AcademyFind",
    description: "Join us in our mission to democratize education discovery.",
    url: "https://academyfind.com/careers",
    siteName: "AcademyFind",
    type: "website",
  }
};

export default async function CareersPage({ searchParams }: { searchParams: Promise<{ q?: string, dept?: string }> }) {
    // Next.js 15 requires searchParams to be awaited
    const sp = await searchParams;
    const q = sp.q || "";
    const dept = sp.dept || "";

    const jobs = await prisma.jobPosting.findMany({
        where: {
            isActive: true,
            OR: q ? [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } }
            ] : undefined,
            department: dept ? { equals: dept } : undefined
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-slate-50/40 font-sans pb-16">
            
            {/* Hero Header */}
            <header className="bg-linear-to-b from-amber-50 via-background to-transparent dark:from-amber-950/10 py-16 text-center px-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-1.5 text-xs font-bold text-amber-700 shadow-sm uppercase tracking-wider mb-6">
                    <Sparkles className="h-3.5 w-3.5" /> Join Our Team
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
                    Build the <span className="text-amber-400">Future</span> With Us
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-slate-500 text-base md:text-lg leading-relaxed">
                    We are on a mission to democratize education discovery. Join AcademyFind and help students make the most important decisions of their lives.
                </p>
            </header>

            <div className="max-w-5xl mx-auto px-4 -mt-4 relative z-10">
                {/* 🔍 Search & Filter Bar */}
                <div className="bg-white border border-slate-200 hover:border-amber-200 rounded-3xl p-5 shadow-sm mb-8">
                    <form method="GET" className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input name="q" defaultValue={q} placeholder="Search job title or keywords..." className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 hover:border-amber-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none text-sm transition-all" />
                        </div>
                        <div className="relative flex-1 md:max-w-xs">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />

                            <select
                                name="dept"
                                defaultValue={dept}
                                className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm outline-none appearance-none cursor-pointer transition-all duration-200 hover:border-amber-300 hover:bg-amber-50/30 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
                            >
                                <option value="">All Departments</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="Operations">Operations</option>
                            </select>

                            {/* Custom Arrow */}
                            <ArrowBigDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none "
                            />
                            
                            </div>
                        <button type="submit" className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-600/10 whitespace-nowrap">
                            Search Roles
                        </button>
                    </form>
                </div>

                {/* 📋 Job Listings */}
                <div className="space-y-4">
                    {jobs.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-amber-300 shadow-sm">
                            <div className="w-16 h-16 bg-amber-50 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No matching roles found</h3>
                            <p className="text-slate-500 mt-2 text-sm">Try adjusting your search or filters, or drop your resume below for future opportunities</p>
                            <Link href="/careers"><Button variant="link" className="mt-2 text-amber-500 font-bold">Clear all filters</Button></Link>
                        </div>
                    ) : (
                        jobs.map((job: any) => (
                            <Link key={job.id} href={`/careers/${job.slug}`} className="group block bg-white p-6 md:p-8 rounded-3xl border border-slate-50 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">{job.department}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">{job.type}</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 group-hover:text-amber-500 transition-colors">{job.title}</h2>
                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-400" /> {job.location}</span>
                                            {job.experience && <span className="flex items-center gap-1.5">• {job.experience}</span>}
                                            {job.Salary && <span className="flex items-center gap-1.5">• {job.Salary}</span>}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <div className="bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm">
                                            View Details <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="mt-16 bg-linear-to-r from-amber-400 to-amber-500 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-extrabold mb-4">Didn't find the perfect role?</h2>
                        <p className="text-amber-100 mb-8 max-w-2xl mx-auto text-lg">
                            We are always looking for passionate and talented individuals. Drop your resume, and we'll reach out when a suitable position opens up!
                        </p>

                        <Link href="/careers/drop-resume">
                            <Button className="cursor-pointer bg-white text-amber-500 hover:bg-slate-50 font-bold px-8 py-6 rounded-xl shadow-lg hover:scale-105 transition-all">
                                Drop Your Resume
                            </Button>
                        </Link>
                    </div>
                    </div>
            </div>
            
        </div>
    );
}