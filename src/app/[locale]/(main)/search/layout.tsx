import type { Metadata } from 'next';
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
  const description = config?.site_description || '专业的Cosplay图集展示平台，汇聚海量优质Cosplay作品';
  const keywords = config?.site_keywords || 'cosplay,图集,二次元,动漫,角色扮演';

  return {
    title: '搜索',
    description: `搜索Cosplay图集和Coser，发现精彩二次元内容 - ${siteName}`,
    keywords: [...keywords.split(','), '搜索'],
    openGraph: {
      title: `搜索 - ${siteName}`,
      description: `搜索Cosplay图集和Coser，发现精彩二次元内容 - ${siteName}`,
      type: 'website',
      locale: 'zh_CN',
    },
  };
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
