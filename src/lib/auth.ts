import { cookies } from 'next/headers';
import { userControllerGetProfile } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { initServerInterceptors } from './server-init';

export type UserData = NonNullable<NonNullable<Awaited<ReturnType<typeof userControllerGetProfile>>['data']>['data']>;

export async function getServerUser(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
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
