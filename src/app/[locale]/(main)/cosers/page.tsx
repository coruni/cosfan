import { Metadata } from 'next';
import { categoryControllerFindAll } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { CosersContent } from './CosersContent';
import { initServerInterceptors } from '@/lib/server-init';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Coser列表',
    description: '浏览所有Coser，发现精彩的Cosplay作品集',
    keywords: ['coser', 'cosplay', '二次元', '角色扮演', '图集'],
    openGraph: {
      title: 'Coser列表',
      description: '浏览所有Coser，发现精彩的Cosplay作品集',
      type: 'website',
      locale: 'zh_CN',
    },
  };
}

async function getCosers() {
  try {
    initServerInterceptors();
    client.setConfig({ baseUrl: API_BASE_URL });
    const response = await categoryControllerFindAll();
    return response.data?.data.data || [];
  } catch (error) {
    console.error('Failed to fetch cosers:', error);
    return [];
  }
}

export default async function CosersPage() {
  const cosers = await getCosers();

  return <CosersContent initialData={cosers} />;
}
