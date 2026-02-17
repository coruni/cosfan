import { MetadataRoute } from 'next';
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

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await getSiteConfig();
  const siteName = config?.site_name || APP_NAME;

  return {
    name: siteName,
    short_name: siteName,
    description: config?.site_description || '专业的Cosplay图集展示平台，汇聚海量优质Cosplay作品',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['entertainment', 'photo', 'social'],
    lang: 'zh-CN',
    dir: 'ltr',
    scope: '/',
    orientation: 'portrait-primary',
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
      },
      {
        src: '/screenshot-narrow.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
