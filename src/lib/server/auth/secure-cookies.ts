import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Cookie configuration for security
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days for refresh token
};

export const ACCESS_COOKIE_CONFIG = {
  ...COOKIE_CONFIG,
  maxAge: 15 * 60, // 15 minutes for access token
};

// Set secure httpOnly cookies for access + refresh tokens
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  // response.cookies.set() in Next.js 13+ generates the Set-Cookie header correctly
  response.cookies.set('accessToken', accessToken, ACCESS_COOKIE_CONFIG);
  response.cookies.set('refreshToken', refreshToken, COOKIE_CONFIG);
}

// Clear auth cookies
export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
}

// Get refresh token from secure cookie
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value;
}

// Get access token from secure cookie  
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value;
}
