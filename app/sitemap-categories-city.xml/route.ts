import { prisma } from '@/lib/prisma';

export const revalidate = 86400; // Cache sitemap for 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://academyfind.com';
  
  // 1. Only categories that actually have at least 1 active and published institute
  const categories = await prisma.category.findMany({
    where: {
      institutes: {
        some: {
          institute: {
            isActive: true,
            isPublished: true,
          },
        },
      },
    },
    select: { slug: true },
  });

  // 2. Fetch distinct category + city combinations that have at least 1 active & published institute
  const uniquePairs = new Set<string>();

  try {
    const rawPairs = await prisma.$queryRaw<Array<{ categorySlug: string; citySlug: string }>>`
      SELECT DISTINCT c.slug AS "categorySlug", ci.slug AS "citySlug"
      FROM "InstituteCategory" ic
      JOIN "Institute" i ON i.id = ic."instituteId"
      JOIN "Category" c ON c.id = ic."categoryId"
      JOIN "City" ci ON ci.id = i."cityId"
      WHERE i."isActive" = true AND i."isPublished" = true
    `;
    for (const item of rawPairs) {
      if (item.categorySlug && item.citySlug) {
        uniquePairs.add(`${item.categorySlug}/${item.citySlug}`);
      }
    }
  } catch (error) {
    console.error('Error fetching raw category-city pairs, falling back to prisma:', error);
    const activePairs = await prisma.instituteCategory.findMany({
      where: {
        institute: {
          isActive: true,
          isPublished: true,
        },
      },
      select: {
        category: { select: { slug: true } },
        institute: { select: { city: { select: { slug: true } } } },
      },
      take: 5000,
    });
    for (const item of activePairs) {
      if (item.category?.slug && item.institute?.city?.slug) {
        uniquePairs.add(`${item.category.slug}/${item.institute.city.slug}`);
      }
    }
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  let urls = '';

  // 1. Valid Category hub pages (/jee-coaching)
  categories.forEach((cat) => {
    urls += `
  <url>
    <loc>${baseUrl}/${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  // 2. ONLY Valid Category + City pages (/jee-coaching/meerut) that actually have institutes
  uniquePairs.forEach((pair) => {
    urls += `
  <url>
    <loc>${baseUrl}/${pair}</loc>
    <lastmod>${today}</lastmod>
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