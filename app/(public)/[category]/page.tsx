// ============================================================
// OPTIMIZED METADATA + JSON-LD — AcademyFind [category] page
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import formatSlug from "@/lib/formatSlug";

import {
  getCategoryBySlug,
  getCitiesForCategory,
  getFeaturedInstitutesForCategory,
} from "@/lib/category/category";

import { getInstitutesByCategory } from "@/lib/category/category_inst";

import Breadcrumb from "@/components/navigation/BreadCrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import TopCities from "@/components/category/TopCities";
import InstituteListing from "@/components/category/CategoryInstituteListing";
import CategoryCTA from "@/components/category/CategoryCTA";
import CategoryFAQ from "@/components/category/CategoryFAQ";
import PopularSearches from "@/components/category/PopularSearches";
import WhyChoose from "@/components/category/WhyChoose";
import Pagination from "@/components/navigation/Pagination";
import CategoryFilters from "@/components/category/CategoryFilter";
import { getCachedInstitutesByCategory, getUncachedInstitutesByCategory } from "@/lib/cachedQueries";

export const revalidate = 86400;

// ─── Types ───────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    rating?: string;
    mode?: string;
    fee?: string;
    userLat?: string;
    userLng?: string;
    closestUser?: string;
    providerType?: string;
  }>;
}

// ─── 1. METADATA ─────────────────────────────────────────────
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const { page } = await searchParams;
  const categoryName = formatSlug(category); // e.g. "IIT JEE Coaching"

  const currentYear = new Date().getFullYear();
  const currentPage = page && parseInt(page, 10) > 1 ? parseInt(page, 10) : null;
  const canonicalUrl = currentPage
    ? `https://academyfind.com/${category}?page=${currentPage}`
    : `https://academyfind.com/${category}`;

  // Under 60 chars for desktop SERP
  const seoTitle = currentPage
    ? `Best ${categoryName} Institutes - Page ${currentPage} | AcademyFind`
    : `Best ${categoryName} Institutes ${currentYear} | Fees, Reviews & Admissions`;


  // 150–160 chars ideal
  const seoDescription = currentPage
    ? `Page ${currentPage} of best ${categoryName} institutes in India. Browse more listings, compare fees, reviews, and find the right coaching. AcademyFind updated ${currentYear}.`
    : `Compare the best ${categoryName} institutes across India. Read genuine student reviews, check fees, batch timings, and get direct admission guidance. Updated ${currentYear}.`;

  return {
    // ── Core ──
    title: seoTitle,
    description: seoDescription,

    // ── Canonical (self-referencing for paginated pages) ──
    alternates: {
      canonical: canonicalUrl,
    },

    // ── Robots: Index all pages so Google discovers all institutes ──
    // Paginated pages (?page=2) are real content with unique institutes
    // noindex was hiding 90%+ of institutes from Google's index
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

    // ── Open Graph ──
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "AcademyFind",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://academyfind.com/final-logo.png",
          width: 1200,
          height: 630,
          alt: `Best ${categoryName} Institutes in India - AcademyFind`,
        },
      ],
    },

    // ── Twitter / X ──
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      site: "@academyfind",
      images: ["https://academyfind.com/final-logo.png"],
    },

    // ── Keywords ──
    ...(currentPage === null && {
      keywords: [
        `best ${categoryName} in India`,
        `top 10 ${categoryName} institutes`,
        `list of ${categoryName} classes`,
        `${categoryName} fees in India`,
        `${categoryName} fee structure`,
        `${categoryName} near me`,
        `compare ${categoryName} institutes`,
        `${categoryName} reviews and ratings`,
        `${categoryName} admission ${currentYear}`,
        `affordable ${categoryName} coaching`,
        `online ${categoryName} classes`,
        `best coaching for ${categoryName}`,
        `top rated ${categoryName} centers`,
      ],
    }),
  };
}

// ─── 2. JSON-LD COMPONENT ────────────────────────────────────
interface Institute {
  id: string;
  name: string;
  slug: string;
  city?: { name: string } | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
}

interface City {
  slug: string;
  name: string;
}

interface CategoryData {
  name: string;
  slug: string;
  description?: string | null;
}

interface JsonLdProps {
  institutes: Institute[];
  cities: City[];
  categoryData: CategoryData;
  category: string;
  totalCount: number;
}

function JsonLdSchemas({ institutes, cities, categoryData, category, totalCount }: JsonLdProps) {
  const baseUrl = "https://academyfind.com";
  const pageUrl = `${baseUrl}/${category}`;
  const currentYear = new Date().getFullYear();
  const categoryName = categoryData.name;

  // ── a) ItemList Schema (🔥 UPGRADED: EducationalOrganization & Ratings) ──
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${categoryName} Institutes in India ${currentYear}`,
    description:
      categoryData.description ||
      `Top ${categoryName} institutes across India with fees, reviews, and contact details.`,
    url: pageUrl,
    numberOfItems: institutes.length > 10 ? 10 : institutes.length, // Ensure count matches array length
    itemListElement: institutes.slice(0, 10).map((institute, index) => {

      // Inject Rating if it exists
      const reviewSchema = institute.googleRating ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: institute.googleRating,
          reviewCount: institute.googleReviewCount || 1,
        }
      } : {};

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "EducationalOrganization",
          url: `${baseUrl}/institute/${institute.id}-${institute.slug}`,
          name: institute.name,
          address: {
            "@type": "PostalAddress",
            addressCountry: "IN",
            addressLocality: institute.city?.name || "India", // Use city if available
          },
          ...reviewSchema
        }
      };
    }),
  };

  // ── b) BreadcrumbList Schema (Unchanged) ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@id": `${pageUrl}#breadcrumb`,
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: categoryName, item: pageUrl },
    ],
  };

  // ── c) FAQPage Schema (🔥 UPGRADED: More detailed answers) ──
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Which are the best ${categoryName} institutes in India?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `AcademyFind lists the top-rated ${categoryName} institutes across India. The rankings are based on genuine student reviews, faculty experience, and historical results. Browse our directory to compare the best options in cities like Delhi, Mumbai, Kota, and more.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the average fee structure for ${categoryName} in India?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The fees for ${categoryName} in India can range from ₹5,000 to ₹1,50,000 per year depending on the institute's location, infrastructure, and reputation. You can check the exact fee details for individual institutes on AcademyFind.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I find the best ${categoryName} near me?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can use the "Closest to Me" filter on the AcademyFind ${categoryName} page to instantly find institutes near your current geographic location. We map hundreds of verified institutes across India.`,
        },
      },
      {
        "@type": "Question",
        name: `Are there online or hybrid ${categoryName} options available?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, post-pandemic, most leading ${categoryName} institutes offer fully online or hybrid learning modes. You can use our "Mode" filter to specifically find institutes that provide digital classes.`,
        },
      },
    ],
  };

  // ── d) WebPage + CollectionPage Schema (Unchanged) ──
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${categoryName} Institutes in India ${currentYear}`,
    url: pageUrl,
    description: `Discover and compare the best ${categoryName} institutes across Indian cities. Updated ${currentYear} listings with fees, reviews, and admissions info.`,
    breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
    publisher: {
      "@type": "Organization",
      name: "AcademyFind",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/final-logo.png` },
    },
    inLanguage: "en-IN",
    hasPart: cities.slice(0, 20).map((city) => ({
      "@type": "WebPage",
      name: `Best ${categoryName} in ${city.name}`,
      url: `${baseUrl}/${category}/${city.slug}`,
    })),
  };

  // ── d) CollectionPage Schema (🔥 GOD LEVEL: Defines the page purpose) ──
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${categoryName} Institutes in India ${currentYear}`,
    description: categoryData.description || `Top ${categoryName} institutes across India with fees, reviews, and contact details.`,
    url: pageUrl,
    about: {
      "@type": "Thing",
      name: categoryName
    }
  };

  return (
    <>
      <Script id="schema-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <Script id="schema-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="schema-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-webpage" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <Script id="schema-collection" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
    </>
  );
}

// ─── 3. PAGE COMPONENT ───────────────────────────────────────
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const { page, q, sort = "reviews", rating, mode, userLat, userLng, closestUser, providerType } = await searchParams;

  const categoryData = await getCategoryBySlug(category);
  if (!categoryData) {
    notFound();
  }

  const cities = await getCitiesForCategory(category);
  const rawPage = page ? parseInt(page, 10) : 1;
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const isClosestActive = closestUser === "true";
  const parsedLat = isClosestActive && userLat ? parseFloat(userLat) : undefined;
  const parsedLng = isClosestActive && userLng ? parseFloat(userLng) : undefined;

  const hasUniqueParams = !!(q || parsedLat || parsedLng);

  const { institutes, totalPages, totalCount } = hasUniqueParams
    ? await getUncachedInstitutesByCategory(
      category,
      currentPage,
      q,
      sort,
      rating,
      mode,
      parsedLat,
      parsedLng,
      providerType,
    )
    : await getCachedInstitutesByCategory(
      category,
      currentPage,
      sort,
      rating,
      mode,
      providerType,
    );

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      {/* ✅ JSON-LD — sirf page 1 pe inject karo */}
      {currentPage === 1 && (
        <JsonLdSchemas
          institutes={institutes}
          cities={cities}
          categoryData={categoryData}
          category={category}
          totalCount={totalCount}
        />
      )}

      <Breadcrumb
        items={[
          {
            label: categoryData.name,
            href: `/${category}`,
          },
        ]}
      />

      <CategoryHero category={categoryData} totalCount={totalCount} />

      <TopCities category={category} cities={cities} />

      <div className="flex flex-col lg:flex-row gap-8 relative mt-16">
        <aside className="lg:w-64 shrink-0 relative lg:sticky lg:top-24 self-start h-fit z-10 mb-6 lg:mb-0">
          <div className="sticky top-24">
            <CategoryFilters category={category} />
          </div>
        </aside>

        <div className="flex-1 min-w-0 w-full">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Explore All {categoryData.name} Institutes
            </h2>
            {isClosestActive && (
              <p className="text-sm text-slate-500 bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-1 rounded-full w-fit flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sorted by: <strong>Closest to Me</strong>
              </p>
            )}
            {q && (
              <p className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                Filtered by: <span className="font-semibold">&quot;{q}&quot;</span>
              </p>
            )}
          </div>

          <InstituteListing institutes={institutes} category={category} />
          <Pagination totalPages={totalPages} />
        </div>
      </div>

      <WhyChoose title={categoryData.name} />
      <PopularSearches categoryName={categoryData.name} />
      <CategoryFAQ categoryName={categoryData.name} />
      <CategoryCTA />
    </main>
  );
}