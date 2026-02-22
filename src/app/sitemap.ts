import { MetadataRoute } from 'next';
import { articleControllerGetPublishedArticleIds, categoryControllerFindAll } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { routing } from '@/i18n/routing';
import { initServerInterceptors } from '@/lib/server-init';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';
  const { locales, defaultLocale } = routing;

  // 初始化服务端拦截器
  initServerInterceptors();
  client.setConfig({
    baseUrl: API_BASE_URL,
  });

  const staticPages: MetadataRoute.Sitemap = [];

  // 生成静态页面的sitemap条目
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
    // 并行获取文章和分类数据
    const [articlesResponse, categoriesResponse] = await Promise.all([
      articleControllerGetPublishedArticleIds(),
      categoryControllerFindAll(),
    ]);

    // 安全地提取数据
    const articlesData = articlesResponse.data?.data;
    const categoriesData = categoriesResponse.data?.data;

    const articles = Array.isArray(articlesData) ? articlesData : [];
    const categories = Array.isArray(categoriesData) ? categoriesData : [];

    const articlePages: MetadataRoute.Sitemap = [];
    const categoryPages: MetadataRoute.Sitemap = [];

    // 生成文章页面的sitemap条目
    for (const locale of locales) {
      const localePath = locale === defaultLocale ? '' : `/${locale}`;

      articles.forEach((article: any) => {
        if (article && article.id) {
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
        }
      });

      // 生成分类页面的sitemap条目
      categories.forEach((category: any) => {
        if (category && category.id) {
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
        }
      });
    }

    return [...staticPages, ...articlePages, ...categoryPages];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    // 如果API调用失败，至少返回静态页面
    return staticPages;
  }
}

// 配置sitemap的重新验证时间（秒）
export const revalidate = 3600; // 每小时重新生成一次
