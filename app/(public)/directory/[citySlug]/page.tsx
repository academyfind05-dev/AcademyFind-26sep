import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    select: { name: true }
  });

  if (!city) return { title: "Not Found" };

  return {
    title: `Top Coaching Institutes & Tutors in ${city.name} - AcademyFind`,
    description: `Explore the complete directory of all top-rated coaching institutes, schools, and tutors in ${city.name}. Read reviews and find the best educational centers near you.`,
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
      canonical: `https://academyfind.com/directory/${citySlug}`,
    },
  };
}

export default async function CityDirectoryPage({ params }: PageProps) {
  const { citySlug } = await params;
  
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    include: {
      institutes: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          categories: {
            take: 1,
            include: { category: true }
          }
        },
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!city) return notFound();

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
            Browse our complete alphabetical list of all {city.institutes.length} verified educational centers below. 
            You can also filter directly by the top categories available in your city to find the best match for your needs.
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 mb-16">
          {city.institutes.map((inst) => (
            <Link 
              key={inst.id} 
              href={`/institute/${inst.id}-${inst.slug}`}
              className="group py-2 border-b border-slate-200 flex flex-col"
            >
              <span className="text-slate-900 font-medium group-hover:text-amber-600 transition-colors">
                {inst.name}
              </span>
              <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                {inst.categories[0]?.category.name || "Institute"}
              </span>
            </Link>
          ))}
        </div>

        {/* Heavy Interlinking: Cross-City */}
        {otherCities.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-200">
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
