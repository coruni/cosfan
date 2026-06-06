import { cookies } from 'next/headers';
import { userControllerGetProfile } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { API_BASE_URL } from '@/config/constants';
import { initServerInterceptors } from './server-init';

export type UserData = NonNullable<NonNullable<Awaited<ReturnType<typeof userControllerGetProfile>>['data']>['data']>;

/**
 * 尝试清除认证相关的cookie（服务端）
 * 注意：Server Components 中无法修改 cookie，仅在 Server Action / Route Handler 中可用。
 * 这里捕获异常以避免在 Server Components 中调用时抛错。
 */
async function tryClearAuthCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    cookieStore.set('access_token', '', { path: '/', maxAge: 0 });
    cookieStore.set('refresh_token', '', { path: '/', maxAge: 0 });
    return true;
  } catch {
    // Server Component 中无法写 cookie，由中间件兜底清除
    return false;
  }
}

/**
 * 检查服务端是否已登录（仅检查token是否存在）
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
 * 若 token 过期（401），尝试清除 cookie；如果当前上下文不允许写 cookie，
 * 标记响应头 x-clear-auth，由中间件在下一次请求兜底清除。
 * @returns 用户信息或null
 */
export async function getServerUser(): Promise<UserData | null> {
  // 先检查是否有token，没有token直接返回null，避免不必要的API调用
  const isAuthenticated = await isServerAuthenticated();
  if (!isAuthenticated) {
    return null;
  }

  try {
    initServerInterceptors();
    client.setConfig({ baseUrl: API_BASE_URL });

    const result = await userControllerGetProfile();

    // hey-api 默认不会在 HTTP 错误时抛出，而是把 response/error 放在结果对象里
    const status = result.response?.status;
    if (status === 401 || status === 403) {
      await handleTokenExpired();
      return null;
    }

    return result.data?.data || null;
  } catch (error) {
    console.error('Failed to get server user:', error);

    // 兜底：某些网络错误或 throwOnError 情形下，从 error 形状中提取状态码
    const errStatus =
      (error as { response?: { status?: number }; status?: number })?.response?.status ??
      (error as { status?: number })?.status;
    if (errStatus === 401 || errStatus === 403) {
      await handleTokenExpired();
    }

    return null;
  }
}

/**
 * 处理 token 过期：尝试直接清除 cookie；
 * 若不可用（Server Component 渲染阶段），写入一个标记 cookie，
 * 让中间件在下一次请求时清除认证 cookie。
 */
async function handleTokenExpired() {
  const cleared = await tryClearAuthCookies();
  if (cleared) return;

  // 在 Server Component 中无法直接清除 access_token / refresh_token，
  // 但通常仍可以写入非 httpOnly 的标记 cookie。再不行就让中间件下次请求时
  // 仍能通过 API 401 反馈链路（客户端 reload）清理。
  try {
    const cookieStore = await cookies();
    cookieStore.set('auth_expired', '1', {
      path: '/',
      maxAge: 60,
      sameSite: 'lax',
    });
  } catch {
    // 完全无法写入 cookie 时不再处理，等待客户端拦截器/下次中间件清理
  }
}
