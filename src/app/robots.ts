import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';
  const { locales, defaultLocale } = routing;

  const sitemaps = locales.map(
    (locale) => `${baseUrl}${locale === defaultLocale ? '' : `/${locale}`}/sitemap.xml`
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profile/', '/settings/', '/wallet/', '/dashboard/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
    ],
    sitemap: sitemaps,
  };
}
