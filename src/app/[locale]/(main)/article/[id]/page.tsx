import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articleControllerFindOne } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { ArticleContent } from './ArticleContent';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  client.setConfig({ baseUrl: API_BASE_URL });
  
  try {
    const response = await articleControllerFindOne({ path: { id } });
    const article = response.data?.data;

    if (!article) {
      return { title: '文章不存在' };
    }

    const title = article.title;
    const description = article.summary || `${article.title} - 高清图集`;
    const images = article.images?.slice(0, 1) || [];
    const coverImage = article.cover || images[0];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: article.createdAt,
        authors: article.author?.nickname ? [article.author.nickname] : undefined,
        images: coverImage ? [{ url: coverImage, alt: title }] : undefined,
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
  
  client.setConfig({ baseUrl: API_BASE_URL });
  
  let initialData = null;
  
  try {
    const response = await articleControllerFindOne({ path: { id } });
    initialData = response.data?.data;
  } catch {
    notFound();
  }

  if (!initialData) {
    notFound();
  }

  return <ArticleContent initialData={initialData} />;
}
