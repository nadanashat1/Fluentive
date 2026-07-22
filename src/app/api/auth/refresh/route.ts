import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { generateAuthTokens, setAuthCookies, UnauthorizedError } from '@/lib/server/auth';
import { withErrorHandler } from '@/lib/server/api-handler';

/**
 * TOKEN REFRESH API
 * Implements refresh token rotation and session validation.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Extract Refresh Token from Cookie
  const refreshToken = request.cookies.get('refreshToken')?.value;
  if (!refreshToken) {
    throw new UnauthorizedError('Missing refresh token');
  }

  // 2. Verify JWT
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, refreshSecret!);
  } catch (err) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // 3. Validate Session in DB
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  });

  if (!session || session.revoked || session.expiresAt < new Date()) {
    // SECURITY: If token is reused or invalid, revoke all sessions for this user (possible breach)
    if (session) {
      await prisma.session.updateMany({
        where: { userId: session.userId },
        data: { revoked: true }
      });
    }
    throw new UnauthorizedError('Session expired or revoked');
  }

  // 4. Generate New Tokens (Rotation)
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAuthTokens(
    session.userId,
    session.user.organizationId
  );

  // 5. Update Session (Rotate Token)
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // 6. Issue Response
  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        isActive: session.user.isActive,
        createdAt: session.user.createdAt.toISOString(),
        updatedAt: session.user.updatedAt.toISOString(),
        organizationId: session.user.organizationId
      },
      token: newAccessToken,
      refreshToken: newRefreshToken
    }
  });
  setAuthCookies(response, newAccessToken, newRefreshToken);

  return response;
});
