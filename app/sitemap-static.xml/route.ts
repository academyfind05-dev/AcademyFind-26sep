import { prisma } from '@/lib/prisma';

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://academyfind.com';
  
  const staticPages = [
    '',
    '/about',
    '/directory',
    '/categories',
    '/cities',
    '/blog',
    '/contact',
    '/careers',
    '/user/life-coach',
    '/privacy-policy',
    '/terms-condition',
  ];

  // Fetch active cities to include their directory hubs
  const activeCities = await prisma.city.findMany({
    where: {
      institutes: { some: { isActive: true } },
    },
    select: { slug: true },
  });

  const cityDirectoryPages = activeCities.map((c) => `/directory/${c.slug}`);
  const allPages = [...staticPages, ...cityDirectoryPages];
  
  const today = new Date().toISOString().split('T')[0];
  const urls = allPages.map((page: string) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : page.startsWith('/directory') ? '0.9' : '0.8'}</priority>
  </url>
  `).join('');

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