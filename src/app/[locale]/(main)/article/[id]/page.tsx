import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articleControllerFindOne, configControllerGetPublicConfigs } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL, APP_NAME } from '@/config/constants';
import { ArticleContent } from './ArticleContent';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import { initServerInterceptors } from '@/lib/server-init';
import { truncateDescription, formatCanonicalUrl } from '@/lib/seo-utils';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  initServerInterceptors();
  client.setConfig({ baseUrl: API_BASE_URL });
  
  try {
    const response = await articleControllerFindOne({ path: { id } });
    const article = response.data?.data;

    if (!article) {
      return { title: '文章不存在' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';
    const articleUrl = formatCanonicalUrl(baseUrl, `/article/${id}`);
    const title = article.title;
    const rawDescription = article.summary || `${article.title} - 高清图集`;
    const description = truncateDescription(rawDescription);
    const images = article.images?.slice(0, 1) || [];
    const coverImage = article.cover || images[0];

    return {
      title,
      description,
      alternates: {
        canonical: articleUrl,
      },
      openGraph: {
        title,
        description,
        type: 'article',
        url: articleUrl,
        publishedTime: article.createdAt,
        authors: article.author?.nickname ? [article.author.nickname] : undefined,
        images: coverImage ? [{ url: coverImage, alt: title, width: 1200, height: 630 }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: coverImage ? [coverImage] : undefined,
      },
    };
  } catch {
    return { title: '文章不存在' };
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  
  initServerInterceptors();
  client.setConfig({ baseUrl: API_BASE_URL });
  
  let initialData = null;
  let siteConfig = null;
  
  try {
    const [articleResponse, configResponse] = await Promise.all([
      articleControllerFindOne({ path: { id } }),
      configControllerGetPublicConfigs(),
    ]);
    initialData = articleResponse.data?.data;
    siteConfig = configResponse.data?.data;
  } catch {
    notFound();
  }

  if (!initialData) {
    notFound();
  }

  const siteName = siteConfig?.site_name || APP_NAME;
  const siteLogo = siteConfig?.site_logo;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';
  const articleUrl = `${baseUrl}/article/${id}`;
  const images = initialData.images?.slice(0, 5) || [];
  const coverImage = initialData.cover || images[0];

  return (
    <>
      <ArticleJsonLd
        title={initialData.title}
        description={initialData.summary || `${initialData.title} - 高清图集`}
        url={articleUrl}
        images={coverImage ? [coverImage, ...images.slice(0, 4)] : undefined}
        datePublished={initialData.createdAt}
        dateModified={initialData.updatedAt}
        author={
          initialData.author?.nickname
            ? { name: initialData.author.nickname }
            : undefined
        }
        publisher={{
          name: siteName,
          logo: siteLogo || `${baseUrl}/icon-192.png`,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: '首页', url: baseUrl },
          { name: '文章', url: `${baseUrl}/article` },
          { name: initialData.title, url: articleUrl },
        ]}
      />
      <ArticleContent initialData={initialData} />
    </>
  );
}
