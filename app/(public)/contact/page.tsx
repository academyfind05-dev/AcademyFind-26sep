// ============================================================
// OPTIMIZED METADATA + JSON-LD — AcademyFind Contact Page
// ============================================================

import { Metadata } from "next";
import Script from "next/script";

import ContactHero from "@/components/contact/ContactHero";
import ContactSection from "@/components/contact/ContactSection";
import ContactFAQ from "@/components/contact/ContactFAQ";

// ─── 1. METADATA ─────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Contact AcademyFind | Get in Touch for Support & Partnerships",
  description: "Have questions about coaching institutes, or want to list your institute on AcademyFind? Reach out to our support team for quick assistance.",
  alternates: {
    canonical: "https://academyfind.com/contact",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Contact AcademyFind",
    description: "Connect with AcademyFind team for queries, support, or business partnerships.",
    url: "https://www.academyfind.com/contact",
    siteName: "AcademyFind",
    type: "website",
  },
};

// ─── 2. JSON-LD (Trust Signals for Contact Page) ─────────────
function JsonLdSchemas() {
  const baseUrl = "https://www.academyfind.com";

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact AcademyFind",
    description: "Get in touch with the AcademyFind support team.",
    publisher: {
      "@type": "Organization",
      name: "AcademyFind",
      url: baseUrl,
      logo: `${baseUrl}/new-logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        url: `${baseUrl}/contact`,
        availableLanguage: ["English", "Hindi"],
      },
    },
  };

  return (
    <Script
      id="schema-contact"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
    />
  );
}

// ─── 3. PAGE COMPONENT ───────────────────────────────────────
export default function ContactPage() {
  return (
    <>
      <JsonLdSchemas />
      <ContactHero />

      <main className="mx-auto max-w-7xl px-4 py-16 space-y-24">
        <ContactSection />
        <ContactFAQ />
      </main>
    </>
  );
}