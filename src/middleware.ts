import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const AUTH_PATHS = ['/login', '/register'];
const PROTECTED_PATHS = ['/profile', '/settings', '/wallet', '/dashboard'];

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/';

  const token = request.cookies.get('access_token')?.value;
  const isAuthenticated = !!token;

  if (isAuthenticated && AUTH_PATHS.some(path => pathnameWithoutLocale.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && PROTECTED_PATHS.some(path => pathnameWithoutLocale.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/(zh|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
