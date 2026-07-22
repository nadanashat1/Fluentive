import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserResponse } from './types';
import { logAuthResolution } from '@/lib/auth/dev-auth-log';

// Custom Error Classes
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden: Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

interface JwtPayload {
  userId?: string;
  id?: string;  // backward compat with old tokens
  iat: number;
  exp: number;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes

function readBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

function readAccessCookieToken(request: NextRequest): string | null {
  const fromJar = request.cookies?.get('accessToken')?.value;
  if (fromJar) return fromJar;

  const raw = request.headers.get('cookie');
  if (!raw) return null;
  const match = raw.match(/(?:^|;\s*)accessToken=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Prefer a cryptographically valid token; Bearer before cookie when both are present. */
function pickAccessToken(bearer: string | null, cookie: string | null): string | null {
  const secret = process.env.JWT_SECRET;
  const candidates = [bearer, cookie].filter((t): t is string => Boolean(t));

  if (!candidates.length) return null;
  if (!secret) return candidates[0];

  for (const token of candidates) {
    try {
      jwt.verify(token, secret);
      return token;
    } catch {
      // try next source (e.g. expired httpOnly cookie vs fresh Bearer)
    }
  }

  return candidates[0];
}

/**
 * TOKEN EXTRACTION
 * Uses the first valid access token (Bearer, then cookie).
 * Avoids rejecting requests when an expired accessToken cookie shadows a valid Bearer token.
 */
export async function extractAccessToken(request: NextRequest): Promise<string | null> {
  const bearer = readBearerToken(request);
  let cookie = readAccessCookieToken(request);

  if (!cookie) {
    try {
      const { cookies } = await import('next/headers');
      const store = await cookies();
      cookie = store.get('accessToken')?.value ?? null;
    } catch {
      // not in a route-handler cookie context
    }
  }

  return pickAccessToken(bearer, cookie);
}

/**
 * AUTHENTICATION GUARDS
 */
export async function requireAuth(request: NextRequest): Promise<{ user: UserResponse | null; error?: string }> {
  const route = request.nextUrl?.pathname ?? new URL(request.url).pathname;
  const hasAccessCookie = !!request.cookies.get('accessToken')?.value;
  const hasRefreshCookie = !!request.cookies.get('refreshToken')?.value;
  const hasBearer = !!request.headers.get('authorization')?.startsWith('Bearer ');

  const logReject = (rejection: string, userId?: string) => {
    logAuthResolution(request, {
      route,
      hasAccessCookie,
      hasRefreshCookie,
      hasBearer,
      resolved: false,
      rejection,
      userId,
    });
  };

  try {
    const token = await extractAccessToken(request);
    if (!token) {
      logReject('MISSING_ACCESS_TOKEN');
      return { user: null, error: 'MISSING_ACCESS_TOKEN' };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logReject('JWT_SECRET_MISSING');
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    // Accept BOTH `userId` and `id` for backward compatibility
    const resolvedUserId = decoded.userId || decoded.id;
    if (!resolvedUserId) {
      logReject('INVALID_TOKEN_PAYLOAD');
      return { user: null, error: 'INVALID_TOKEN_PAYLOAD' };
    }

    const user = await prisma.user.findUnique({
      where: { id: resolvedUserId },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        isActive: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive || user.isDeleted) {
      logReject('INVALID_USER', resolvedUserId);
      return { user: null, error: 'INVALID_USER' };
    }

    logAuthResolution(request, {
      route,
      hasAccessCookie,
      hasRefreshCookie,
      hasBearer,
      resolved: true,
      userId: user.id,
    });

    return { 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        organizationId: user.organizationId || null
      } as UserResponse
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logReject('TOKEN_EXPIRED');
      return { user: null, error: 'TOKEN_EXPIRED' };
    }
    logReject('INVALID_TOKEN');
    return { user: null, error: 'INVALID_TOKEN' };
  }
}

export async function requireUser(request: NextRequest): Promise<UserResponse> {
  const { user, error } = await requireAuth(request);
  if (!user) throw new UnauthorizedError(error || 'Authentication required');
  return user;
}

/**
 * TOKEN GENERATION
 */
export async function generateAuthTokens(userId: string, organizationId?: string | null) {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || secret; // Fallback if not set
  if (!secret) throw new Error('JWT_SECRET not configured');

  const accessToken = jwt.sign({ userId, organizationId }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId }, refreshSecret!, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
}

/**
 * COOKIE MANAGEMENT
 */
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE
  });

  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE
  });

  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
  return response;
}

export async function getUserFromRequest(request: NextRequest): Promise<UserResponse | null> {
  const { user } = await requireAuth(request);
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<UserResponse> {
  const user = await requireUser(request);
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new ForbiddenError('Admin access required');
  }
  return user;
}
