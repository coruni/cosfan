import type { Metadata } from 'next';
import { categoryControllerFindOne, configControllerGetPublicConfigs } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL, APP_NAME } from '@/config/constants';

interface CoserLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

async function getCoser(id: string) {
  try {
    client.setConfig({ baseUrl: API_BASE_URL });
    const response = await categoryControllerFindOne({
      path: { id },
    });
    return response.data?.data;
  } catch (error) {
    console.error('Failed to fetch coser:', error);
    return null;
  }
}

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

export async function generateMetadata({ params }: CoserLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const [coser, siteConfig] = await Promise.all([getCoser(id), getSiteConfig()]);

  const coserData = coser as { name?: string; description?: string } | null;
  const siteName = siteConfig?.site_name || APP_NAME;
  const title = coserData?.name || 'Coser';
  const description = coserData?.description || `查看 ${title} 的Cosplay作品集`;
  const keywords = siteConfig?.site_keywords || 'cosplay,图集,二次元,动漫,角色扮演';

  return {
    title,
    description,
    keywords: [...keywords.split(','), title, 'coser'],
    openGraph: {
      title: `${title} - ${siteName}`,
      description,
      type: 'profile',
      locale: 'zh_CN',
    },
  };
}

export default function CoserLayout({ children }: CoserLayoutProps) {
  return <>{children}</>;
}
