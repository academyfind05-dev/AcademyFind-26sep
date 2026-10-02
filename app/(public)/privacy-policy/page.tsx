import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AcademyFind",
  description: "Learn how AcademyFind collects, uses, and protects your personal data and privacy. We are committed to safeguarding your information.",
  alternates: {
    canonical: "https://academyfind.com/privacy-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
          Last Updated: June 18, 2026
        </p>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <p className="text-lg text-slate-600">
            Welcome to AcademyFind ("we," "our," or "us"). We are committed to
            protecting your personal information and your right to privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website hosted at{" "}
            <a href="https://www.academyfind.com" className="text-emerald-600 font-medium hover:underline">
              https://www.academyfind.com
            </a>.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              1.1 Information We Collect
            </h2>
            <p className="mb-4">
              We collect personal information that you voluntarily provide to us
              when you register on the platform, express an interest in obtaining
              information about us or our services, or otherwise when you contact
              us.
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600">
              <li>
                <strong className="text-slate-800">Personal Data Provided by You:</strong> This
                includes names, email addresses, profile pictures, login
                credentials (via our authentication system), and billing/payment
                details if you subscribe to a premium tier.
              </li>
              <li>
                <strong className="text-slate-800">Automatically Collected Information:</strong> When
                you browse AcademyFind, we automatically collect certain technical
                data, including your IP address, browser type, operating system,
                and device details.
              </li>
              <li>
                <strong className="text-slate-800">Platform Usage Data:</strong> To enhance your
                user experience, we securely track your recent interactions,
                including your shortlists, saved institutes, and a browsing
                history capped at your last 20 viewed institute profiles.
              </li>
              <li>
                <strong className="text-slate-800">Public Data & Third-Party APIs:</strong> We
                aggregate publicly available business details (such as academy
                names, addresses, maps, and coordinates) using third-party
                services like the Google Places API.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              1.2 How We Use Your Information
            </h2>
            <p className="mb-4">
              We use the information we collect or receive for the following
              business purposes:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600">
              <li>
                <strong className="text-slate-800">To Facilitate Account Creation:</strong> We use
                your authentication data to manage user sessions and roles (User,
                Institute Manager, Sales Manager, Admin).
              </li>
              <li>
                <strong className="text-slate-800">To Manage Premium Subscriptions:</strong> To
                enforce plan-specific limits (e.g., adding up to 3 team members
                under the Premium Plan and up to 5 team members under the Ultra
                Plan) and automatically extend subscription benefits to
                co-managers.
              </li>
              <li>
                <strong className="text-slate-800">To Improve Platform Analytics:</strong> We use
                tools like Google Analytics 4 (GA4) to track user behavior,
                traffic sources, and optimize page load speeds.
              </li>
              <li>
                <strong className="text-slate-800">To Enforce Security:</strong> To prevent
                fraudulent claims of academy profiles and monitor api/endpoint
                abuse.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              1.3 Sharing and Disclosure of Your Data
            </h2>
            <p className="mb-4">
              We only share your information with your consent or in the following
              situations:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-600">
              <li>
                <strong className="text-slate-800">With Third-Party Service Providers:</strong> We
                share data with infrastructure vendors, database management
                systems, payment gateways, and geolocation APIs to maintain normal
                site operations.
              </li>
              <li>
                <strong className="text-slate-800">Profile Verification & Public Display:</strong>{" "}
                Information regarding an academy is displayed publicly on the
                directory. Personal user logs, dashboards, settings, and bookmarks
                are strictly private and excluded from search engine crawls.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              1.4 Data Retention and Security
            </h2>
            <p className="text-slate-600">
              We retain your personal data only for as long as necessary to
              fulfill the purposes outlined in this policy. We implement robust
              technological and administrative security measures designed to
              protect your data from unauthorized access. However, please remember
              that no electronic transmission over the internet can be guaranteed
              100% secure.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}