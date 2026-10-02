import { prisma } from '@/lib/prisma';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://academyfind.com';

  const totalInstitutes = await prisma.institute.count({
    where: { isActive: true, isPublished: true } 
  });
  
  const limit = 6000; 
  const totalPages = Math.ceil(totalInstitutes / limit);

  let instituteSitemaps = '';
  for (let i = 0; i < totalPages; i++) {
    instituteSitemaps += `
  <sitemap>
    <loc>${baseUrl}/sitemap-institutes/${i}</loc>
  </sitemap>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories-city.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blogs.xml</loc>
  </sitemap>
  ${instituteSitemaps}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}