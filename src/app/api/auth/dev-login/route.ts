import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { setAuthCookies } from '@/lib/server/auth/secure-cookies';
import { ApiResponse, createSuccessResponse } from '@/types/api-response';

// DEV ONLY: Mock login for testing without database
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Dev login only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    // Mock user data
    const mockUser = {
      id: 'dev-user-123',
      name: 'Development User',
      email: 'dev@fluentive.com',
      role: 'ADMIN'
    };

    // Generate tokens
    const accessToken = jwt.sign(
      { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: mockUser.id },
      secret,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      createSuccessResponse({
        token: accessToken,
        refreshToken,
        user: mockUser
      })
    );

    // Set cookies
    setAuthCookies(response, accessToken, refreshToken);
    
    console.log('[Dev Auth] Mock login successful for:', mockUser.email);
    return response;

  } catch (error: any) {
    console.error('[Dev Auth] Mock login error:', error);
    return NextResponse.json(
      { error: error.message || 'Dev login failed' },
      { status: 500 }
    );
  }
}
