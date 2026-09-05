import { NextResponse } from 'next/server';

const protectedPrefixes = [
  '/dashboard',
  '/farms',
  '/crops',
  '/analysis',
  '/history',
  '/weather',
  '/risk',
  '/recommendations',
  '/analytics',
  '/reports',
  '/profile',
  '/settings',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('agroassist_token')?.value;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Prevent logged-in users from visiting login or signup again
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/farms/:path*',
    '/crops/:path*',
    '/analysis/:path*',
    '/history/:path*',
    '/weather/:path*',
    '/risk/:path*',
    '/recommendations/:path*',
    '/analytics/:path*',
    '/reports/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
};
