import { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'auth-token';

export interface AuthCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  path: string;
}

export const DEFAULT_COOKIE_OPTIONS: AuthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, DEFAULT_COOKIE_OPTIONS);
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(AUTH_COOKIE_NAME);
}

export function getAuthCookie(request: NextRequest): string | undefined {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value;
}

export function createAuthResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  
  if (data.token) {
    setAuthCookie(response, data.token);
  }
  
  return response;
}
