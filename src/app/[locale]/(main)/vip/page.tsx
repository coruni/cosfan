import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { configControllerGetPublicConfigs } from "@/api/sdk.gen";
import { client } from "@/api/client.gen";
import { API_BASE_URL } from "@/config/constants";
import { VIPClient } from "./VIPClient";
import { initServerInterceptors } from "@/lib/server-init";

async function getSiteConfig() {
  try {
    initServerInterceptors();
    client.setConfig({ baseUrl: API_BASE_URL });
    const response = await configControllerGetPublicConfigs();
    return response.data?.data;
  } catch (error) {
    console.error("Failed to fetch site config:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const config = await getSiteConfig();
  const siteName = config?.site_name || "";
  const t = await getTranslations({ locale, namespace: 'vip' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://picart.example.com";

  return {
    title: t('seo.title', { siteName }),
    description: t('seo.description', { siteName }),
    keywords: t('seo.keywords').split(","),
    alternates: {
      canonical: `${baseUrl}/${locale}/vip`,
      languages: {
        'zh': `${baseUrl}/zh/vip`,
        'en': `${baseUrl}/en/vip`,
      },
    },
    openGraph: {
      title: t('seo.title', { siteName }),
      description: t('seo.description', { siteName }),
      type: "website",
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/${locale}/vip`,
    },
    twitter: {
      card: "summary_large_image",
      title: t('seo.title', { siteName }),
      description: t('seo.description', { siteName }),
    },
  };
}

export default async function VIPPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const config = await getSiteConfig();
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          {t('loading')}
        </div>
      }
    >
      <VIPClient config={config || {}} />
    </Suspense>
  );
}
