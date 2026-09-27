import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import extractId from "@/lib/extractId";
import { prisma } from "@/lib/prisma";
import { NoticeBoardSection } from "@/components/notices/NoticeBoardSection";
import { Bell } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/navigation/BreadCrumbs";
import { NoticeCard } from "@/components/notices/NoticeCard";
import { NoticeCategory } from "@/app/generated/prisma/client";
import { NOTICE_CATEGORY_META } from "@/components/notices/notice-meta";

interface Props {
  params: Promise<{ idSlug: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idSlug } = await params;
  const id = extractId(idSlug);
  const institute = await prisma.institute.findUnique({
    where: { id },
    select: { name: true, slug: true },
  });
  if (!institute) return {};
  return {
    title: `Notices | ${institute.name} | AcademyFind`,
    description: `Latest announcements, exam schedules, fee updates and official notices from ${institute.name}.`,
    openGraph: {
      title: `${institute.name} — Notice Board`,
      description: `All official notices from ${institute.name}`,
    },
  };
}

export default async function InstituteNoticesPage({ params, searchParams }: Props) {
  const { idSlug } = await params;
  const { category } = await searchParams;
  const id = extractId(idSlug);
  const now = new Date();

  const institute = await prisma.institute.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, logo: true, imageUrl: true, subscriptionPlan: true },
  });
  if (!institute) notFound();

  const isEligible = institute.subscriptionPlan === "PREMIUM" || institute.subscriptionPlan === "ULTRA";
  if (!isEligible) {
    redirect(`/institute/${institute.slug}`);
  }

  const whereClause: any = {
    instituteId: id,
    isActive: true,
    visibility: "PUBLIC",
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  if (category && category !== "ALL") {
    whereClause.category = category as NoticeCategory;
  }

  const notices = await prisma.instituteNotice.findMany({
    where: whereClause,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      priority: true,
      isPinned: true,
      expiresAt: true,
      attachmentUrl: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });

  const categories = Object.entries(NOTICE_CATEGORY_META);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: institute.name, href: `/institute/${institute.slug}` },
          { label: "Notices", href: "#" },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/90 px-3.5 py-1 text-xs font-semibold text-amber-800 shadow-2xs backdrop-blur-xs mb-3">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Official Notice Board
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {institute.name}
          <span className="block text-xl font-bold text-slate-500 mt-1">
            Notice Board
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          All official announcements from {institute.name}. Pinned notices appear at the top.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-7">
        <Link
          href={`/institute/${institute.slug}/notices`}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            !category || category === "ALL"
              ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200"
              : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
          }`}
        >
          All
        </Link>
        {categories.map(([key, meta]) => (
          <Link
            key={key}
            href={`/institute/${institute.slug}/notices?category=${key}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              category === key
                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
            }`}
          >
            {meta.label}
          </Link>
        ))}
      </div>

      {/* Notices */}
      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-400 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">No notices yet</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            This institute hasn&apos;t posted any public notices yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice as any} />
          ))}
        </div>
      )}
    </div>
  );
}
