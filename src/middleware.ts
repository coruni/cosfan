import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const AUTH_PATHS = ['/login', '/register'];
const PROTECTED_PATHS = ['/profile', '/settings', '/wallet', '/dashboard'];

const intlMiddleware = createMiddleware(routing);

function generateDeviceId(): string {
  return 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function clearAuthCookiesOn(response: NextResponse) {
  response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
  response.cookies.set('auth_expired', '', { path: '/', maxAge: 0 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const searchParams = request.nextUrl.searchParams;
  const reason = searchParams.get('reason');

  // SSR 探测到 token 过期会写入 auth_expired 标记 cookie，
  // 或客户端拦截器跳转时带上 ?reason=token_expired —— 两种情况都按已登出处理。
  const ssrTokenExpired =
    request.cookies.get('auth_expired')?.value === '1' || reason === 'token_expired';

  const pathnameWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/';

  const rawToken = request.cookies.get('access_token')?.value;
  // 如果 SSR 标记了过期，视为未认证
  const token = ssrTokenExpired ? undefined : rawToken;
  let deviceId = request.cookies.get('device_id')?.value;
  const isAuthenticated = !!token;

  if (!deviceId) {
    deviceId = generateDeviceId();
  }

  let response: NextResponse;

  if (isAuthenticated && AUTH_PATHS.some(path => pathnameWithoutLocale.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    response = NextResponse.redirect(url);
  } else if (!isAuthenticated && PROTECTED_PATHS.some(path => pathnameWithoutLocale.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    url.searchParams.delete('reason');
    response = NextResponse.redirect(url);
  } else if (ssrTokenExpired && reason === 'token_expired') {
    // 清掉 URL 上的 reason 参数避免刷新后重复触发
    const url = request.nextUrl.clone();
    url.searchParams.delete('reason');
    response = NextResponse.redirect(url);
  } else {
    response = intlMiddleware(request);
  }

  // 任何 ssrTokenExpired 触发的响应都需要把过期相关 cookie 清干净
  if (ssrTokenExpired) {
    clearAuthCookiesOn(response);
  }

  // 确保device_id cookie存在且一致
  if (!request.cookies.get('device_id')?.value) {
    response.cookies.set('device_id', deviceId, {
      path: '/',
      maxAge: 31536000, // 1年
      sameSite: 'lax',
      httpOnly: false, // 允许客户端JavaScript读取
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/(zh|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
