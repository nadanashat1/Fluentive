import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearAuthCookies } from '@/lib/server/auth';

/**
 * LOGOUT API
 * Clears cookies and revokes the session in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Revoke the session in the DB
      await prisma.session.updateMany({
        where: { refreshToken },
        data: { revoked: true }
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    clearAuthCookies(response);
    return response;

  } catch (error) {
    console.error('[Logout] Error:', error);
    // Still clear cookies even if DB update fails
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}
