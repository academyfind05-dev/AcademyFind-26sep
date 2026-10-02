import { NextResponse } from 'next/server';

/**
 * Google Ping API — Notify Google that the sitemap has been updated.
 * 
 * Usage:
 *   POST /api/ping-sitemap
 *   Body: { "sitemapUrl": "https://academyfind.com/sitemap.xml" }
 * 
 * Google's official mechanism: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#addsitemap
 * This pings Google to re-crawl the sitemap immediately instead of waiting for the next scheduled crawl.
 */

export async function POST(request: Request) {
  try {
    const { sitemapUrl } = await request.json();
    const url = sitemapUrl || 'https://academyfind.com/sitemap.xml';

    // Google's official sitemap ping endpoint
    const googlePing = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(url)}`,
      { method: 'GET' }
    );

    return NextResponse.json({
      success: true,
      google: googlePing.status,
      pinged: url,
    });
  } catch (error) {
    console.error('Sitemap ping error:', error);
    return NextResponse.json({ error: 'Failed to ping' }, { status: 500 });
  }
}
