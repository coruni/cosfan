import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { configControllerGetPublicConfigs } from "@/api/sdk.gen";
import { client } from "@/api/client.gen";
import { API_BASE_URL } from "@/config/constants";
import { routing } from "@/i18n/routing";
import { initServerInterceptors } from "@/lib/server-init";
import { getServerUser } from "@/lib/auth";

// 使用本地字体，避免 Google Fonts 在中国大陆无法访问的问题
const geistSans = localFont({
  src: [
    {
      path: "../../../public/fonts/Geist-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Geist-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Geist-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Geist-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

const geistMono = localFont({
  src: [
    {
      path: "../../../public/fonts/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  fallback: ["Consolas", "Monaco", "Courier New", "monospace"],
});

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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();

  const siteName = config?.site_name || "";
  const description = config?.site_description || "";
  const keywords = config?.site_keywords || "";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const siteLogo = config?.site_logo;
  const siteFavicon = config?.site_favicon;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: keywords.split(","),
    authors: [{ name: siteName }],
    creator: siteName,
    icons: {
      icon: siteFavicon || "/favicon.ico",
      apple: siteLogo || "/apple-touch-icon.png",
    },
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: baseUrl,
      title: siteName,
      description,
      siteName,
      images: siteLogo
        ? [{ url: siteLogo, alt: siteName, width: 1200, height: 630 }]
        : [
            {
              url: `${baseUrl}/og-image.png`,
              width: 1200,
              height: 630,
              alt: siteName,
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: siteLogo ? [siteLogo] : [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!locale || !routing.locales.includes(locale as "zh" | "en")) {
    return null;
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const siteConfig = await getSiteConfig();
  const serverUser = await getServerUser();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <SiteConfigProvider config={siteConfig ?? null}>
                <AuthProvider serverUser={serverUser}>
                  <NextTopLoader
                    color="var(--primary)"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
                    template='<div class="bar" role="bar"><div class="peg"></div></div>'
                    zIndex={1600}
                    showAtBottom={false}
                  />
                  <div id="main-content">{children}</div>
                  <Toaster />
                </AuthProvider>
              </SiteConfigProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
