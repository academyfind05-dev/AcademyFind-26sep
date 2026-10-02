import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

interface PageProps {
  params: Promise<{ citySlug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const page = resolvedSearchParams.page;

  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    select: { name: true }
  });

  if (!city) return { title: "Not Found" };

  const canonicalUrl = page && page !== "1" 
    ? `https://academyfind.com/directory/${citySlug}?page=${page}`
    : `https://academyfind.com/directory/${citySlug}`;

  return {
    title: `Top Coaching Institutes & Tutors in ${city.name} - AcademyFind`,
    description: `Explore the complete directory of verified coaching institutes, schools, and tutors in ${city.name}. Read reviews and find the best educational centers near you.`,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CityDirectoryPage({ params, searchParams }: PageProps) {
  const { citySlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10) || 1);
  const pageSize = 60;
  const skip = (currentPage - 1) * pageSize;

  const [city, totalInstitutes, institutes] = await Promise.all([
    prisma.city.findUnique({
      where: { slug: citySlug },
      select: { id: true, name: true, slug: true }
    }),
    prisma.institute.count({
      where: { city: { slug: citySlug }, isActive: true }
    }),
    prisma.institute.findMany({
      where: { city: { slug: citySlug }, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        categories: {
          take: 1,
          include: { category: true }
        }
      },
      orderBy: { name: 'asc' },
      skip: skip,
      take: pageSize
    })
  ]);

  if (!city) return notFound();

  const totalPages = Math.ceil(totalInstitutes / pageSize);

  // Fetch all active categories present in this city for heavy interlinking
  const cityCategories = await prisma.category.findMany({
    where: { institutes: { some: { institute: { city: { slug: citySlug }, isActive: true } } } },
    select: { name: true, slug: true },
    orderBy: { name: 'asc' }
  });

  // Fetch other random active cities for cross-linking
  const otherCities = await prisma.city.findMany({
    where: { slug: { not: citySlug }, institutes: { some: { isActive: true } } },
    select: { name: true, slug: true },
    take: 8
  });

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb for Directory */}
        <div className="mb-6 text-sm text-slate-500">
          <Link href="/directory" className="hover:text-amber-600 transition">Directory</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{city.name}</span>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-6">
          Educational Institutes in {city.name}
        </h1>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-10">
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Welcome to the ultimate directory for coaching institutes and schools in <strong>{city.name}</strong>. 
            Browse verified educational centers below ({totalInstitutes.toLocaleString()} total listed). 
            You can also filter directly by top categories available in {city.name} to find the best match for your needs.
          </p>

          {/* Heavy Interlinking: Category Silos */}
          {cityCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Top Categories in {city.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cityCategories.map(cat => (
                  <Link 
                    key={cat.slug} 
                    href={`/${cat.slug}/${city.slug}`}
                    className="inline-flex bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {cat.name} in {city.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Capped Paginated Institute Grid (Fast 60-Item DOM) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 mb-8">
          {institutes.map((inst) => (
            <Link 
              key={inst.id} 
              href={`/institute/${inst.id}-${inst.slug}`}
              className="group py-2 border-b border-slate-200 flex flex-col"
            >
              <span className="text-slate-900 font-medium group-hover:text-amber-600 transition-colors line-clamp-1">
                {inst.name}
              </span>
              <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                {inst.categories[0]?.category?.name || "Institute"}
              </span>
            </Link>
          ))}
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-6 mb-16">
            <div>
              {currentPage > 1 ? (
                <Link
                  href={currentPage === 2 ? `/directory/${citySlug}` : `/directory/${citySlug}?page=${currentPage - 1}`}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed">
                  ← Previous
                </span>
              )}
            </div>

            <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <div>
              {currentPage < totalPages ? (
                <Link
                  href={`/directory/${citySlug}?page=${currentPage + 1}`}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                >
                  Next →
                </Link>
              ) : (
                <span className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed">
                  Next →
                </span>
              )}
            </div>
          </div>
        )}

        {/* Heavy Interlinking: Cross-City */}
        {otherCities.length > 0 && (
          <div className="mt-8 pt-10 border-t border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Explore Educational Institutes in Other Cities
            </h3>
            <div className="flex flex-wrap gap-3">
              {otherCities.map(other => (
                <Link 
                  key={other.slug} 
                  href={`/directory/${other.slug}`}
                  className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-2 rounded-xl text-slate-700 hover:text-blue-700 font-medium transition-all shadow-sm"
                >
                  Institutes in {other.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
