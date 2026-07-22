import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { User } from '@/types';
import { getUserFromRequest, requireAuth as baseRequireAuth } from '@/lib/server/auth';

type RequestLike = NextRequest | Request;

type RequireAuthResult = {
  user: User | null;
  error?: string;
};

export async function getUserFromToken(request?: RequestLike): Promise<User | null> {
  return getUserFromRequest(request as unknown as NextRequest);
}

export async function requireAuth(request?: RequestLike): Promise<RequireAuthResult> {
  return baseRequireAuth(request as unknown as NextRequest);
}
