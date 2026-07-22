import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';


const REFRESH_SECRET = (() => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is not set');
  }
  return secret;
})();

// Production-grade cookie settings
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days for refresh token
};

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token (short-lived: 15 minutes)
 */
export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing in environment variables');
  }
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

/**
 * Generate refresh token (long-lived: 7 days)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Set auth cookies (httpOnly, secure, strict)
 */
export async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = await cookies();
  
  // Set access token (shorter expiry)
  cookieStore.set('accessToken', tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60, // 15 minutes
  });
  
  // Set refresh token (longer expiry)
  cookieStore.set('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
}

/**
 * Clear auth cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

/**
 * Get access token from cookies
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value;
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value;
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing in environment variables');
  }
  return jwt.verify(token, secret) as TokenPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
