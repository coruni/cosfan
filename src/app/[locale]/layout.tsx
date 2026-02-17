import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { configControllerGetPublicConfigs } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL, APP_NAME } from '@/config/constants';
import { routing } from '@/i18n/routing';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  
  const siteName = config?.site_name || APP_NAME;
  const description = config?.site_description || '专业的Cosplay图集展示平台，汇聚海量优质Cosplay作品';
  const keywords = config?.site_keywords || 'cosplay,图集,二次元,动漫,角色扮演';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://picart.example.com';
  const siteLogo = config?.site_logo;
  const siteFavicon = config?.site_favicon;

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: keywords.split(','),
    authors: [{ name: siteName }],
    creator: siteName,
    icons: {
      icon: siteFavicon || '/favicon.ico',
      apple: siteLogo || '/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: baseUrl,
      title: siteName,
      description,
      siteName,
      images: siteLogo
        ? [{ url: siteLogo, alt: siteName }]
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
      card: 'summary_large_image',
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
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
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
  
  if (!locale || !routing.locales.includes(locale as any)) {
    return null;
  }
  
  setRequestLocale(locale);
  const messages = await getMessages();

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
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
