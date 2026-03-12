import type { Metadata } from "next";
import { Suspense } from "react";
import { HomePageContent } from "./HomePageContent";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo";
import { configControllerGetPublicConfigs } from "@/api/sdk.gen";
import { client } from "@/api/client.gen";
import { API_BASE_URL } from "@/config/constants";
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

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const siteName = config?.site_name || "";
  const siteSubtitle = config?.site_subtitle || "";
  const description = config?.site_description || "";
  const keywords = config?.site_keywords || "";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://picart.example.com";

  const fullTitle = siteSubtitle ? `${siteName} | ${siteSubtitle}` : siteName;

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    keywords: keywords.split(","),
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      locale: "zh_CN",
      url: baseUrl,
    },
  };
}

export default async function HomePage() {
  const config = await getSiteConfig();
  const siteName = config?.site_name ||"";
  const description = config?.site_description || "";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

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
          queryInput: "required name=search_term_string",
        }}
      />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
        <HomePageContent />
      </Suspense>
    </>
  );
}
