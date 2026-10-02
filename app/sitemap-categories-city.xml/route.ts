import { prisma } from '@/lib/prisma';

export const revalidate = 86400; // Cache sitemap for 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://academyfind.com';
  
  // 1. Only categories that actually have active institutes
  const categories = await prisma.category.findMany({
    where: {
      institutes: {
        some: {
          institute: { isActive: true },
        },
      },
    },
    select: { slug: true },
  });

  // 2. Fetch distinct category + city pairs with active institutes
  const activePairs = await prisma.instituteCategory.findMany({
    where: {
      institute: {
        isActive: true,
      },
    },
    select: {
      category: { select: { slug: true } },
      institute: { select: { city: { select: { slug: true } } } },
    },
  });

  const uniquePairs = new Set<string>();
  for (const item of activePairs) {
    if (item.category?.slug && item.institute?.city?.slug) {
      uniquePairs.add(`${item.category.slug}/${item.institute.city.slug}`);
    }
  }

  let urls = '';

  // 1. Valid Category hub pages (/jee-coaching)
  categories.forEach((cat) => {
    urls += `
  <url>
    <loc>${baseUrl}/${cat.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  // 2. ONLY Valid Category + City pages (/jee-coaching/meerut) that actually have institutes
  uniquePairs.forEach((pair) => {
    urls += `
  <url>
    <loc>${baseUrl}/${pair}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}