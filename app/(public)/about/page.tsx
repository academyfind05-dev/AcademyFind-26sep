// ============================================================
// OPTIMIZED METADATA + JSON-LD — AcademyFind About Page
// ============================================================

import AboutHero from "@/components/about/AboutHero";
import MissionSection from "@/components/about/MissionSection";
import WhyChooseUs from "@/components/about/WhyChooseUs";
import StatsSection from "@/components/about/StatsSection";
import AboutCTA from "@/components/about/AboutSection";
import { OwnerCTA } from "@/components/home/OwnerCTA";
import { Metadata } from "next";
import Script from "next/script";

// ─── 1. METADATA (Supercharged for Brand SEO) ────────────────
export const metadata: Metadata = {
  title: "About Us | AcademyFind - India's Most Trusted Education Directory",
  description: "Learn about AcademyFind's mission to simplify education search. Discover how we connect students with the top coaching institutes, schools, and hostels across India.",
  alternates: {
    canonical: 'https://academyfind.com/about',
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
    title: 'About AcademyFind | Revolutionizing Education Search',
    description: 'We are on a mission to bring transparency to the education sector by connecting students with the best institutes across India.',
    url: 'https://www.academyfind.com/about',
    siteName: 'AcademyFind',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://www.academyfind.com/new-logo.png', // Replace with a team photo or brand banner if available
        width: 1200,
        height: 630,
        alt: 'About AcademyFind',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | AcademyFind',
    description: 'Discover how AcademyFind is simplifying the search for the perfect educational institute.',
    site: '@academyfind',
    images: ['https://www.academyfind.com/new-logo.png'],
  },
  keywords: [
    'about AcademyFind',
    'AcademyFind mission',
    'education directory India',
    'find coaching institutes',
    'student institute connection',
    'trusted education platform',
    'compare coaching fees',
    'AcademyFind team',
    'education search engine',
  ],
};

// ─── 2. JSON-LD COMPONENT (The E-E-A-T Hack) ─────────────────
function JsonLdSchemas() {
  const baseUrl = "https://www.academyfind.com";
  const pageUrl = `${baseUrl}/about`;

  // ── a) Organization Schema (Crucial for Brand Trust & Knowledge Panel) ──
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AcademyFind",
    url: baseUrl,
    logo: `${baseUrl}/new-logo.png`,
    description: "AcademyFind is India's premier programmatic education directory, helping students discover, compare, and connect with top coaching institutes, schools, and hostels.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${baseUrl}/contact`,
      availableLanguage: ["English", "Hindi"]
    },
    // SameAs array is highly recommended if you have social media pages
    sameAs: [
      "https://wa.me/919045699938",
      "https://www.instagram.com/academyfind", 
      "https://www.facebook.com/profile.php?id=61561180379260",
      "https://www.linkedin.com/company/academyfind",
      "https://www.youtube.com/channel/UCYiRb6vo_Rr_w3PO746hsKg",
      "https://t.me/academyfind"
    ]
  };

  // ── b) AboutPage Schema ──
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About AcademyFind",
    url: pageUrl,
    description: "Learn about the mission, vision, and team behind AcademyFind.",
    publisher: {
      "@id": `${baseUrl}/#organization`
    }
  };

  // ── c) BreadcrumbList Schema ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About Us",
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-about-page"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <Script
        id="schema-breadcrumb-about"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

// ─── 3. PAGE COMPONENT ───────────────────────────────────────
export default function AboutPage() {
  return (
    <>
      <JsonLdSchemas />
      <AboutHero />

      <main className="mx-auto max-w-7xl px-4 py-16 space-y-24">
        <MissionSection />
        <WhyChooseUs />
        <StatsSection />
        <AboutCTA />
        <OwnerCTA />
      </main>
    </>
  );
}