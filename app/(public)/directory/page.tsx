import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AcademyFind Directory - All Coaching Institutes & Schools by City",
  description: "Explore the ultimate directory of all top-rated coaching institutes, schools, and tutors across India. Browse by city and find the best educational centers near you.",
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
    canonical: "https://academyfind.com/directory",
  },
};

export default async function DirectoryPage() {
  // Fetch all cities that have active institutes
  const cities = await prisma.city.findMany({
    where: {
      institutes: { some: { isActive: true } }
    },
    include: {
      _count: {
        select: {
          institutes: { where: { isActive: true } }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-6">
          AcademyFind Directory
        </h1>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-12">
          <p className="text-lg text-slate-700 leading-relaxed">
            Welcome to the ultimate directory for coaching institutes and educational centers across India. 
            Whether you are looking for UPSC, IIT-JEE, NEET coaching, or local tuition classes, our comprehensive 
            database connects you with thousands of verified institutes. Select your city below to explore 
            all available educational centers, read genuine student reviews, and find the perfect match for your career goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cities.map((city) => (
            <Link 
              key={city.id} 
              href={`/directory/${city.slug}`}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                {city.name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {city._count.institutes} Institutes
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
