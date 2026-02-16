import { Suspense } from 'react';
import { configControllerGetPublicConfigs } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { VIPClient } from './VIPClient';

async function getVipConfig() {
  try {
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
