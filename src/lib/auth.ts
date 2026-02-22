import { cookies } from 'next/headers';
import { userControllerGetProfile } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { initServerInterceptors } from './server-init';

export type UserData = NonNullable<NonNullable<Awaited<ReturnType<typeof userControllerGetProfile>>['data']>['data']>;

/**
 * 检查服务端是否已登录（仅检查token是否存在）
 * @returns 如果存在有效的access_token返回true，否则返回false
 */
export async function isServerAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    return !!token;
  } catch (error) {
    console.error('Failed to check server authentication:', error);
    return false;
  }
}

/**
 * 获取服务端用户信息
 * 先检查是否已登录，如果已登录则获取用户信息
 * @returns 用户信息或null
 */
export async function getServerUser(): Promise<UserData | null> {
  try {
    // 先检查是否有token，没有token直接返回null，避免不必要的API调用
    const isAuthenticated = await isServerAuthenticated();
    if (!isAuthenticated) {
      console.log('No token found, skipping user fetch');
      return null;
    }

    initServerInterceptors();
    client.setConfig({ baseUrl: API_BASE_URL });

    const response = await userControllerGetProfile();

    return response.data?.data || null;
  } catch (error) {
    console.error('Failed to get server user:', error);
    return null;
  }
}
