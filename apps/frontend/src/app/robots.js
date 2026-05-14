// Auto-generates /robots.txt — no manual file needed
// ⚠️ Replace SITE_URL with your actual production domain

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://collabx.live';

export default function robots() {
  return {
    rules: [
      {
        // All crawlers (Google, Bing, DuckDuckGo, Yandex, Baidu, etc.)
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/register',
          '/pricing',
          '/privacy',
          '/terms',
          '/refund',
          '/contact',
          '/security',
          '/cookies',
          '/og-image.png',
          '/collabx_logo.svg',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/room/',
          '/profile',
          '/profile/',
          '/api/',
          '/_next/',
          '/fonts/',
        ],
      },
      {
        // Explicitly allow Googlebot (belt-and-suspenders)
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard', '/room/', '/profile', '/api/'],
      },
      {
        // Allow Bingbot
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/dashboard', '/room/', '/profile', '/api/'],
      },
      {
        // Allow DuckDuckBot
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: ['/dashboard', '/room/', '/profile', '/api/'],
      },
      {
        // Allow Yandex
        userAgent: 'YandexBot',
        allow: '/',
        disallow: ['/dashboard', '/room/', '/profile', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
