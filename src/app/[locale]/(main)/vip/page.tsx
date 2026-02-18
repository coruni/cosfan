import { Suspense } from 'react';
import type { Metadata } from 'next';
import { configControllerGetPublicConfigs } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL, APP_NAME } from '@/config/constants';
import { VIPClient } from './VIPClient';
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

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const siteName = config?.site_name || APP_NAME;
  const keywords = config?.site_keywords || 'cosplay,图集,二次元,动漫,角色扮演';

  return {
    title: 'VIP会员',
    description: `开通VIP会员，享受更多专属权益和高清图集下载 - ${siteName}`,
    keywords: [...keywords.split(','), 'VIP', '会员', '高清', '下载'],
    openGraph: {
      title: `VIP会员 - ${siteName}`,
      description: `开通VIP会员，享受更多专属权益和高清图集下载 - ${siteName}`,
      type: 'website',
      locale: 'zh_CN',
    },
  };
}

async function getVipConfig() {
  try {
    initServerInterceptors();
    client.setConfig({ baseUrl: API_BASE_URL });
    const response = await configControllerGetPublicConfigs();
    return response.data?.data || {};
  } catch (error) {
    console.error('Failed to fetch VIP config:', error);
    return {};
  }
}

export default async function VIPPage() {
  const config = await getVipConfig();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">加载中...</div>}>
      <VIPClient config={config} />
    </Suspense>
  );
}
