// Enterprise Proxy / Middleware
// CRITICAL: This file acts as Next.js middleware (src/proxy.ts with matcher config).
// It MUST NOT block auth routes or strip Set-Cookie headers.

import { NextRequest, NextResponse } from 'next/server';

// Routes that must NEVER be blocked by auth checks
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/login',
  '/register',
  '/forgot-password',
  '/_next',
  '/favicon.ico',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PUBLIC ROUTES: Pass through immediately with zero interference
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    // Security headers only — no auth validation, no cookie manipulation
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // PROTECTED ROUTES: Just pass through and add security headers
  // Auth enforcement happens in the route handlers themselves (requireAuth/requireUser)
  // The proxy should NOT duplicate auth logic — that causes the 401 double-gate problem
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/api/(.*)',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
