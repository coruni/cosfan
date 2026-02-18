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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/';

  const token = request.cookies.get('access_token')?.value;
  let deviceId = request.cookies.get('device_id')?.value;
  const isAuthenticated = !!token;

  // 如果没有device_id，生成一个新的
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
    response = NextResponse.redirect(url);
  } else {
    response = intlMiddleware(request);
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
