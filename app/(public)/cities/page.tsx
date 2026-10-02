// ============================================================
// OPTIMIZED METADATA + JSON-LD — AcademyFind Cities Hub Page
// ============================================================

import { prisma } from "@/lib/prisma";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import Script from "next/script";

// ✅ Correct Next.js App Router Cache syntax
export const revalidate = 86400;

// ─── 1. METADATA (Supercharged Location SEO) ─────────────────
export const metadata: Metadata = {
  title: "Explore Coaching Institutes by City in India | AcademyFind",
  description: "Discover top-rated coaching centers, schools, tuition classes, and learning hubs across all major cities and states in India. Find the best education near you.",
  alternates: {
    canonical: "https://academyfind.com/cities",
  },
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
  openGraph: {
    title: "Explore Educational Institutes by City | AcademyFind",
    description: "Browse verified coaching centers and schools organized by state and city across India.",
    url: "https://www.academyfind.com/cities",
    siteName: "AcademyFind",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://www.academyfind.com/new-logo.png",
        width: 1200,
        height: 630,
        alt: "Cities and States - AcademyFind",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Institutes by City | AcademyFind",
    description: "Find the best education centers in your city.",
    site: "@academyfind",
    images: ["https://www.academyfind.com/new-logo.png"],
  },
  keywords: [
    "coaching institutes by city",
    "top educational cities in India",
    "find tuition centers near me",
    "state wise coaching directory",
    "city wise school list",
    "best coaching hubs in India",
    "Delhi Mumbai Kota coaching",
    "education directory India",
    "local coaching search",
    "AcademyFind cities",
  ],
};

// ─── 2. JSON-LD COMPONENT ────────────────────────────────────
interface JsonLdProps {
  cities: Array<{ id: string; name: string; slug: string; state: string }>;
}

function JsonLdSchemas({ cities }: JsonLdProps) {
  const baseUrl = "https://www.academyfind.com";
  const pageUrl = `${baseUrl}/cities`;

  // ── a) ItemList Schema (Tells Google this is a Directory of Cities) ──
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Educational Hubs & Cities in India",
    description: "List of all active cities on AcademyFind with verified coaching institutes and schools.",
    url: pageUrl,
    numberOfItems: cities.length,
    itemListElement: cities.slice(0, 100).map((city, index) => ({
      "@type": "ListItem",
      position: index + 1,
      // Change to your actual route structure if it's different
      url: `${baseUrl}/categories?city=${city.slug}`, 
      name: `Institutes in ${city.name || city.slug}`,
    })),
  };

  // ── b) BreadcrumbList Schema ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Cities", item: pageUrl },
    ],
  };

  // ── c) FAQPage Schema (For Location-based Queries) ──
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Which cities in India are best known for coaching institutes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cities like Kota, Delhi, Hyderabad, Pune, and Bangalore are major educational hubs in India. AcademyFind lists top-rated institutes across these cities and many more.",
        },
      },
      {
        "@type": "Question",
        name: "How can I find coaching classes in my specific city?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can browse our 'Cities' directory to find your state and city, or use our location filters to instantly see verified coaching institutes near your area.",
        },
      },
    ],
  };

  // ── d) CollectionPage Schema (🔥 GOD LEVEL) ──
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Top Coaching Institutes by City | AcademyFind",
    description: "Explore AcademyFind's comprehensive directory of coaching centers, schools, and hostels across major cities in India.",
    url: "https://academyfind.com/cities",
  };

  return (
    <>
      <Script id="schema-itemlist-cities" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <Script id="schema-breadcrumb-cities" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="schema-faq-cities" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-collection-cities" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
    </>
  );
}

// ─── 3. PAGE COMPONENT ───────────────────────────────────────
export default async function CititesPage() {
  const cities = await prisma.city.findMany({
    include: {
      _count: {
        select: {
          institutes: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
    orderBy: { state: "asc" },
  });

  const activeCities = cities.filter((city: any) => city._count.institutes > 0);

  const groupByState: Record<string, typeof activeCities> = {};

  activeCities.forEach((city: any) => {
    const stateName = city.state || "Other Regions";
    if (!groupByState[stateName]) {
      groupByState[stateName] = [];
    }
    groupByState[stateName].push(city);
  });

  const sortedStates = Object.keys(groupByState).sort();

  // Mapping schema data safely
  const schemaCities = activeCities.map((c: any) => ({
    id: c.id,
    name: c.name || c.slug,
    slug: c.slug,
    state: c.state || "Other Regions",
  }));

  return (
    <>
      <JsonLdSchemas cities={schemaCities} />
      
      <div className="min-h-screen bg-slate-50/40 font-sans pb-16">
        {/* Hero Header Section */}
        <header className="bg-gradient-to-b from-amber-50 via-background to-transparent py-16 text-center px-4 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-1.5 text-xs font-bold text-amber-600 shadow-xs uppercase tracking-wider backdrop-blur-xs">
            <MapPin className="h-3.5 w-3.5 animate-bounce" /> Pan-India Coverage
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-6 tracking-tight">
            Explore Institutes by <span className="text-amber-400">City</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-slate-500 text-sm md:text-base leading-relaxed">
            Select your city to discover top-rated coaching centers, school tuitions, exam prep hubs, and skill development classes near you.
          </p>
        </header>

        {/* Main Content Area */}
        <main className="container mx-auto px-4 mt-12 max-w-6xl">
          {activeCities.length === 0 ? (
            <div className="text-center bg-white border border-slate-200 rounded-3xl p-12 shadow-xs">
              <p className="text-muted-foreground font-medium">No active cities found with institutes yet.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {sortedStates.map((state: any) => (
                <div key={state} className="space-y-4">
                  {/* State Heading Badge */}
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest bg-slate-200/60 px-3 py-1 rounded-md text-xs">
                      {state}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      ({groupByState[state].length} {groupByState[state].length === 1 ? 'City' : 'Cities'})
                    </span>
                  </div>

                  {/* Cities Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-start bg-gradient-to-b from-amber-50 via-background">
                    {groupByState[state]
                      .sort((a: any, b: any) => (a.name || a.slug || "").localeCompare(b.name || b.slug || ""))
                      .map((city: any) => (
                        <Link
                          key={city.id}
                          href={`/categories?city=${city.slug}`}
                          className="group border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all duration-200 hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5 bg-white"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700 group-hover:text-amber-500 transition-colors text-sm sm:text-base capitalize">
                              {city.name || city.slug || "Unknown"}
                            </p>
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              <span>{city._count.institutes} Listed</span>
                            </div>
                          </div>

                          <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors shrink-0">
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}