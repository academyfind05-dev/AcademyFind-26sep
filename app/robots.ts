import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://academyfind.com';

  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        '/af-ass-manage/',
        '/profile/',
        '/api/',
        '/manager/',
        '/sales_manager/',
        '/user/create-institute',
        '/search',
        '/generated/',
        '/login',
        '/register',
        '/*/claim',
        '/*?sort=',
        '/*?rating=',
        '/*?q=',
      ],
    },
    {
      userAgent: 'GPTBot',
      disallow: '/',
    },
    {
      userAgent: 'ClaudeBot',
      disallow: '/',
    },
    {
      userAgent: 'MJ12bot',
      crawlDelay: 30
    },
    {
      userAgent: 'AhrefsBot',
      crawlDelay: 30
    }
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-categories-city.xml`,
      `${baseUrl}/sitemap-blogs.xml`,
      `${baseUrl}/sitemap-static.xml`,
    ],
  }
}