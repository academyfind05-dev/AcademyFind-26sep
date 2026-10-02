import { NextResponse } from 'next/server';

/**
 * IndexNow API — Instantly notify Bing, Yandex, Seznam, and Naver
 * when new institutes or pages are added/updated.
 * 
 * Usage:
 *   POST /api/indexnow
 *   Body: { "urls": ["https://academyfind.com/institute/abc-xyz"] }
 * 
 * This is called automatically when institute data changes via admin/manager panels.
 * Bing shares indexing signals with other IndexNow-compatible engines.
 */

const INDEXNOW_KEY = 'af2026indexnowkey9045699938';

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    // IndexNow supports batch submission of up to 10,000 URLs
    const payload = {
      host: 'academyfind.com',
      key: INDEXNOW_KEY,
      keyLocation: `https://academyfind.com/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(0, 10000), // Cap at 10k per spec
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      status: response.status,
      submitted: urls.length,
    });
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
