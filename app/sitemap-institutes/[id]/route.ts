import { prisma } from '@/lib/prisma';

// Type constraint theek ho gaya kyunki folder ka naam exactly [id] hai
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://academyfind.com';
  
  const { id } = await params;
  const pageId = parseInt(id) || 0;
  
  const limit = 6000;
  const skip = pageId * limit;

  const institutes = await prisma.institute.findMany({
    where: { isActive: true, isPublished: true },
    select: { id: true, slug: true, updatedAt: true },
    skip: skip,
    take: limit,
    orderBy: { id: 'asc' } 
  });

  const urls = institutes.map((inst: any) => `
  <url>
    <loc>${baseUrl}/institute/${inst.id}-${inst.slug}</loc>
    <lastmod>${inst.updatedAt ? new Date(inst.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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