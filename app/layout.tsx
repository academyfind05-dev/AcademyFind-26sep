import type { Metadata } from "next";
import GoogleMapsProvider from "@/components/providers/GoogleMapsProvider";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

import Navbar from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";
import { CursorGlow } from "@/components/ui/cursor-glow";
import { AuthPromptModal } from "@/components/layout/auth-prompt-model";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'react-hot-toast'
import { GoogleOneTap } from "@/components/layout/GoogleOneTap";
import GlobalCallbackFAB from "@/components/User/GlobalCallBack";
import UserActivityTracker from "@/components/User/UserActivityTracker";
import { getCachedSession } from "@/lib/auth/session";
import VisitorTracker from "@/components/analytics/VisitorTracker";
import MobileAppProvider from "@/components/providers/MobileAppProvider";
import PhoneNudgeBanner from "@/components/auth/PhoneNudgeBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Variable definition helps in Tailwind if needed
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

// ─── GLOBAL METADATA & FALLBACKS ─────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://academyfind.com"),

  title: {
    template: "%s | AcademyFind",
    default: "AcademyFind | India's Most Trusted Education and Non Academic Coaching Directory",
  },

  description: "Discover top-rated coaching centers, schools, and hostels across India. Compare fees, read verified reviews, and book free strategy calls on AcademyFind.",

  keywords: [
    "education directory India",
    "find coaching institutes",
    "AcademyFind",
    "student mentorship",
    "compare coaching fees"
  ],

  authors: [{ name: "AcademyFind Team" }],
  creator: "AcademyFind",
  publisher: "AcademyFind",

  icons: {
    icon: '/favicon-new.png',
    shortcut: '/favicon-new.png',
    apple: '/favicon-new.png',
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://academyfind.com",
    title: "AcademyFind | Find the Best Coaching & Institutes",
    description: "Discover top-rated coaching centers, schools, and hostels.",
    siteName: "AcademyFind",
    images: [
      {
        url: "/final-logo.png",
        width: 1200,
        height: 630,
        alt: "AcademyFind Banner",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@academyfind",
    title: "AcademyFind | Find the Best Coaching & Institutes",
    description: "Discover top-rated coaching centers, schools, and hostels.",
    images: ["/final-logo.png"],
  },

  // Removed manual icons config to use app/icon.png instead

  // 🚀 GOOGLE SEARCH CONSOLE VERIFICATION
  verification: {
    // google: "YOUR_SEARCH_CONSOLE_VERIFICATION_CODE_HERE", // 🔥 YAHAN APNA GSC CODE DAALNA JAB MILEGA
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCachedSession()
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.className} h-full antialiased`}
      suppressHydrationWarning // Prevents hydration warnings from browser extensions
    >
      <head>
        {/* Unified Google Tag for Analytics and Ads */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18380080605"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              gtag('config', 'AW-18380080605');
              gtag('config', 'G-DE480Y479E', {
                page_path: window.location.pathname,
              });
            `
          }}
        />
      </head>
      <body
        className={`min-h-full flex flex-col ${inter.className}`}
      >
        {/* <Navbar session={session}/> */}

        {/* <CursorGlow /> */}
        <GoogleMapsProvider>
          <NextTopLoader color="#f59e0b" showSpinner={false} />
          <PhoneNudgeBanner />

          <main className="flex-1">
            {children}
          </main>
        </GoogleMapsProvider>

        <UserActivityTracker />
        <VisitorTracker />
        <Toaster position="top-center" reverseOrder={false} />
        <GoogleOneTap />
        <MobileAppProvider />
        {/* <AuthPromptModal isAuthenticated={Boolean(session?.user)} />
        
        <Footer />
        {/* <GlobalCallbackFAB /> */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}