import { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { CosersContent } from './CosersContent';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cosersPage' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(','),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
    },
  };
}

function CosersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CosersPage() {
  return (
    <Suspense fallback={<CosersSkeleton />}>
      <CosersContent />
    </Suspense>
  );
}