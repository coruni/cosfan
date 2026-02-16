import { MetadataRoute } from 'next';
import { articleControllerGetPublishedArticleIds, categoryControllerFindAll } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';
  const { locales, defaultLocale } = routing;

  client.setConfig({
    baseUrl: API_BASE_URL,
  });

  const staticPages: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const localePath = locale === defaultLocale ? '' : `/${locale}`;
    
    staticPages.push(
      {
        url: `${baseUrl}${localePath}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}${l === defaultLocale ? '' : `/${l}`}`])
          ),
        },
      },
      {
        url: `${baseUrl}${localePath}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}${localePath}/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}${localePath}/cosers`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}${localePath}/search`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}${localePath}/vip`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}${localePath}/discover`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }
    );
  }

  try {
    const [articlesResponse, categoriesResponse] = await Promise.all([
      articleControllerGetPublishedArticleIds(),
      categoryControllerFindAll(),
    ]);

    const articles = articlesResponse.data?.data || [];
    const categories = categoriesResponse.data?.data || [];

    const articlePages: MetadataRoute.Sitemap = [];
    const categoryPages: MetadataRoute.Sitemap = [];

    for (const locale of locales) {
      const localePath = locale === defaultLocale ? '' : `/${locale}`;

      articles.forEach((article) => {
        articlePages.push({
          url: `${baseUrl}${localePath}/article/${article.id}`,
          lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [
                l,
                `${baseUrl}${l === defaultLocale ? '' : `/${l}`}/article/${article.id}`,
              ])
            ),
          },
        });
      });

      (categories as Array<{ id: number }>).forEach((category) => {
        categoryPages.push({
          url: `${baseUrl}${localePath}/cosers/${category.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [
                l,
                `${baseUrl}${l === defaultLocale ? '' : `/${l}`}/cosers/${category.id}`,
              ])
            ),
          },
        });
      });
    }

    return [...staticPages, ...articlePages, ...categoryPages];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return staticPages;
  }
}
