import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | AcademyFind",
  description: "Read the terms of service, user guidelines, and rules for using the AcademyFind platform.",
  alternates: {
    canonical: "https://academyfind.com/terms-condition",
  },
  robots: {
    index: true,
    follow: true, 
  },
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          Terms & Conditions
        </h1>
        <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
          Last Updated: June 18, 2026
        </p>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <p className="text-lg text-slate-600">
            Please read these Terms and Conditions ("Terms", "Terms of Service")
            carefully before using the AcademyFind directory platform website
            operated by AcademyFind.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              2.1 Acceptance of Terms
            </h2>
            <p className="text-slate-600">
              By accessing or using our platform, you agree to be bound by these
              Terms. If you disagree with any part of the terms, you may not
              access the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              2.2 The Nature of Our Service
            </h2>
            <p className="mb-4">
              AcademyFind is an online programmatic directory platform designed to
              help users search, filter, and discover educational institutes,
              coaching classes, schools, and hostels across various cities.
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600">
              <li>
                <strong className="text-slate-800">Data Accuracy Disclaimer:</strong> Some
                institute data is populated programmatically via public
                geocoding/places APIs. While we strive to maintain clean listings,
                we do not verify or guarantee the pricing, fee structures, or
                quality of service of unverified or unclaimed listings.
              </li>
              <li>
                <strong className="text-slate-800">User Mapping & Filters:</strong> Search
                filters, radius queries, and maps are provided for positional
                reference only. Actual physical boundaries and coaching details
                may vary.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              2.3 Profile Claiming and Management
            </h2>
            <p className="mb-4">
              Educational institutes listed on AcademyFind can be claimed by their
              rightful owners or authorized representatives.
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600">
              <li>
                <strong className="text-slate-800">Manager Roles:</strong> Upon successfully
                claiming a profile or being added by an owner, your user account
                role upgrades to an <code>INSTITUTE_MANAGER</code>.
              </li>
              <li>
                <strong className="text-slate-800">Team Additions & Tier Limits:</strong> Team
                management capabilities are governed by your subscription plan.
                The Premium Plan allows up to 3 team members, and the Ultra Plan
                allows up to 5 team members.
              </li>
              <li>
                <strong className="text-slate-800">Shared Benefits:</strong> Added co-managers
                automatically inherit the respective Premium or Ultra subscription
                features assigned to that specific institute profile.
              </li>
              <li>
                <strong className="text-slate-800">Account Responsibility:</strong> Managers are
                completely responsible for all updates, media modifications
                (including uploaded images), and announcements published from
                their manager dashboard.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              2.4 Prohibited Activities
            </h2>
            <p className="mb-4">Users and managers are strictly prohibited from:</p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600">
              <li>
                Using automated scrapers, bots, or data-mining tools to extract
                directory data.
              </li>
              <li>
                Abusing the location autocomplete search bar inputs to inflate
                Google Places API query sessions maliciously.
              </li>
              <li>
                Uploading offensive, inaccurate, or copyrighted media to institute
                galleries.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              2.5 Limitation of Liability
            </h2>
            <p className="text-slate-600">
              In no event shall AcademyFind, nor its directors, employees, or
              partners, be liable for any indirect, incidental, special,
              consequential, or punitive damages, including without limitation,
              loss of profits, data, use, goodwill, or other intangible losses,
              resulting from your access to or use of the service or database
              connectivity timeouts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}