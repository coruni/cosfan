import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DiscoverPageContent } from './DiscoverPageContent';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbJsonLd } from '@/components/seo';
import { configControllerGetPublicConfigs } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { initServerInterceptors } from '@/lib/server-init';

async function getSiteConfig() {
  try {
    initServerInterceptors();
    client.setConfig({ baseUrl: API_BASE_URL });
    const response = await configControllerGetPublicConfigs();
    return response.data?.data;
  } catch (error) {
    console.error('Failed to fetch site config:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'discover' });
  const config = await getSiteConfig();
  const siteName = config?.site_name || '';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';

  const title = t('title');
  const description = locale === 'zh'
    ? `探索热门Coser和精选Cosplay图集，发现优质Cosplay作品。${siteName ? ` - ${siteName}` : ''}`
    : `Discover popular cosers and curated cosplay galleries.${siteName ? ` - ${siteName}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/discover`,
    },
    openGraph: {
      title: `${title}${siteName ? ` | ${siteName}` : ''}`,
      description,
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/discover`,
    },
  };
}



function DiscoverSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      
      <section>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const config = await getSiteConfig();
  const siteName = config?.site_name || '';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: siteName || 'Home', url: baseUrl },
          { name: 'Discover', url: `${baseUrl}/discover` },
        ]}
      />
      <Suspense fallback={<DiscoverSkeleton />}>
        <DiscoverPageContent />
      </Suspense>
    </>
  );
}
