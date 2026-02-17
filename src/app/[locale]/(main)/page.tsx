import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { HomePageContent } from './HomePageContent';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo';
import { configControllerGetPublicConfigs } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL, APP_NAME } from '@/config/constants';

async function getSiteConfig() {
  try {
    client.setConfig({ baseUrl: API_BASE_URL });
    const response = await configControllerGetPublicConfigs();
    return response.data?.data;
  } catch (error) {
    console.error('Failed to fetch site config:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const siteName = config?.site_name || APP_NAME;
  const siteSubtitle = config?.site_subtitle || '';
  const description = config?.site_description || '专业的Cosplay图集展示平台，汇聚海量优质Cosplay作品';
  const keywords = config?.site_keywords || 'cosplay,图集,二次元,动漫,角色扮演';

  const fullTitle = siteSubtitle ? `${siteName} | ${siteSubtitle}` : siteName;

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    keywords: keywords.split(','),
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      locale: 'zh_CN',
    },
  };
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <section>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border bg-card">
              <Skeleton className="aspect-[3/4]" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function HomePage() {
  const config = await getSiteConfig();
  const siteName = config?.site_name || APP_NAME;
  const description = config?.site_description || '专业的Cosplay图集展示平台，汇聚海量优质Cosplay作品';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';

  return (
    <>
      <OrganizationJsonLd
        name={siteName}
        url={baseUrl}
        description={description}
      />
      <WebSiteJsonLd
        name={siteName}
        url={baseUrl}
        description={description}
        potentialAction={{
          target: `${baseUrl}/search?q={search_term_string}`,
          queryInput: 'required name=search_term_string',
        }}
      />
      <Suspense fallback={<HomeSkeleton />}>
        <HomePageContent />
      </Suspense>
    </>
  );
}
