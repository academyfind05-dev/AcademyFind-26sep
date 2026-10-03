import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaLinkedinIn, FaTelegram, FaWhatsapp, FaYoutube } from "react-icons/fa";
const categories = [
  {
    name: "JEE Coaching",
    slug: "jee-coaching",
  },
  {
    name: "NEET Coaching",
    slug: "neet-coaching",
  },
  {
    name: "UPSC Coaching",
    slug: "upsc-coaching",
  },
  {
    name: "SSC Coaching",
    slug: "ssc-coaching",
  },
  {
    name: "Coding Classes",
    slug: "coding-classes",
  },
  {
    name: "Dance Classes",
    slug: "dance-classes",
  },
  {
    name: "View All Categories",
    slug: "categories",
  },
];

const cities = [
  {
    name: "Delhi",
    slug: "directory/delhi",
  },
  {
    name: "Noida",
    slug: "directory/noida",
  },
  {
    name: "Gurugram",
    slug: "directory/gurugram",
  },
  {
    name: "Greater Noida",
    slug: "directory/greater-noida",
  },
  {
    name: "Faridabad",
    slug: "directory/faridabad",
  },
  {
    name: "Ghaziabad",
    slug: "directory/ghaziabad",
  },
  {
    name: "Jaipur",
    slug: "directory/jaipur",
  },
  {
    name: "Kota",
    slug: "directory/kota",
  },
  {
    name: "Lucknow",
    slug: "directory/lucknow",
  },
];

const comparisons = [
  {
    name: "Allen Kallu Sarai vs Allen Janakpuri",
    href: "/compare/allen-career-institute---kalu-sarai-campus-iit-jee-neet-foundation-coaching-vs-allen-career-institute---janakpuri-iit-wing-campus-iit-jee-neet-foundation-coaching"
  },
  {
    name:"Entropy Classes vs FAST Eduventures ",
    href: "/compare/entropy-classes-vs-fast-eduventures-by-iitians-nitians-for-jee-neet-boards-olympiads"
  },
  {
    name: "NARAYANA Janakpuri vs Akash coaching institute",
    href: "/compare/narayana-iitneetfoundation-janakpuri-vs-akash-coaching-institute"
  },
  {
    name: "View All",
    href: "/compare"
  }
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Top */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link
              href="/"
              prefetch={false}
              className="
                flex
                items-center
                gap-2
                justify-start
              "
            >
              <Image
                src="/favicon-new.png"
                alt="AcademyFind Logo"
                width={36}
                height={36} />

              <div>
                <h2 className="text-xl font-bold">
                  AcademyFind
                </h2>

                <p className="text-[11px] text-muted-foreground">
                  Academy Search Simplified
                </p>
              </div>
            </Link>

            <p
              className="
                mt-4
                max-w-sm
                text-left
                text-sm
                text-muted-foreground
              "
            >
              Discover coaching institutes, compare options,
              read reviews, and make smarter education decisions.
            </p>

            <div className="mt-6 flex justify-start gap-4 flex-wrap">
              <SocialLink href="https://wa.me/919045699938" icon={<FaWhatsapp className="h-5 w-5 text-[#128C7E]" />} />
              <SocialLink href="https://t.me/academyfind" icon={<FaTelegram className="h-5 w-5 text-[#24A1DE]" />} />
              <SocialLink href="https://www.linkedin.com/company/academyfind" icon={<FaLinkedinIn className="h-5 w-5 text-[#0A66C2]" />} />
              <SocialLink href="https://www.facebook.com/profile.php?id=61561180379260" icon={<FaFacebook className="h-5 w-5 text-[#1877F2]" />} />
              <SocialLink href="https://www.instagram.com/academyfind" icon={<FaInstagram className="h-5 w-5 text-pink-400" />} />
              <SocialLink href="https://www.youtube.com/channel/UCYiRb6vo_Rr_w3PO746hsKg" icon={<FaYoutube className="h-5 w-5 text-[#FF0000]" />} />
            </div>

            {/* Trust Badge */}
            <div
              className="
                mt-5
                inline-flex
                rounded-full
                border
                bg-background
                px-3
                py-1.5
                text-xs
                text-muted-foreground
              "
            >
              🇮🇳 Trusted by Students Across India
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 font-semibold">
              Categories
            </h3>

            <ul className="space-y-3 text-sm text-muted-foreground">
              {categories.map((item) => (
                <li key={item.slug}>
                  <Link
                    prefetch={false}
                    href={`/${item.slug}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h3 className="mb-4 font-semibold">
              Popular Cities
            </h3>

            <ul className="space-y-3 text-sm text-muted-foreground">
              {cities.map((item) => (
                <li key={item.slug}>
                  <Link
                    prefetch={false}
                    href={`/${item.slug}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compare */}
          <div>
            <h3 className="mb-4 font-semibold">
              Compare Institutes
            </h3>

            <ul className="space-y-3 text-sm text-muted-foreground">
              {comparisons.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

                {/* Bottom */}
        <div
          className="
            mt-10
            border-t
            pt-6
            text-sm
            text-muted-foreground
          "
        >
          <div
            className="
              flex
              flex-col
              items-center
              gap-4
              text-center
              md:flex-row
              md:justify-between
              md:text-left
            "
          >
            <p>
              <Link href="/directory" className="text-muted-foreground hover:text-muted-foreground/80 transition-colors" title="Institute Directory">
                © 2026 AcademyFind. All rights reserved.
              </Link>
            </p>

            <div
              className="
                flex
                flex-wrap
                justify-center
                gap-4
                md:justify-end
                md:gap-6
              "
            >
              <Link
                href="/about"
                prefetch={false}
                className="transition-colors hover:text-foreground"
              >
                About
              </Link>

              <Link
                href="/contact"
                prefetch={false}
                className="transition-colors hover:text-foreground"
              >
                Contact Us
              </Link>

              <Link
                href={"/privacy-policy"}
                prefetch={false}
                className="transition-colors hover:text-foreground"
              >
                Privacy
              </Link>

              <Link
                  href={"/terms-condition"}
                  prefetch={false}
                className="transition-colors hover:text-foreground"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Link 
      prefetch={false}
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-muted-foreground transition-colors hover:text-amber-600"
    >
      {icon}
    </Link>
  );
}