import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth/password-service';
import { generateAuthTokens, setAuthCookies } from '@/lib/server/auth';
import { withRateLimit } from '@/lib/server/rate-limiter';

/**
 * ENTERPRISE LOGIN API
 * Rebuilt with maximum diagnostic visibility and session tracking.
 */
export const POST = withRateLimit(async (request: Request) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    console.log('[Login] Attempt for email:', email);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 1. Find user
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        isActive: true,
        isDeleted: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!dbUser || !dbUser.isActive || dbUser.isDeleted) {
      console.log('[Login] REJECT: User not found or inactive:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Compare password
    const isPasswordValid = await comparePassword(password, dbUser.password);
    if (!isPasswordValid) {
      console.log('[Login] REJECT: Password mismatch for:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('[Login] SUCCESS for:', email);

    // 3. Generate tokens
    const { accessToken, refreshToken } = await generateAuthTokens(
      dbUser.id, 
      dbUser.organizationId
    );

    // 4. Store session in DB
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await prisma.session.create({
      data: {
        userId: dbUser.id,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    });

    // 5. Build response with cookies
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          isActive: dbUser.isActive,
          createdAt: dbUser.createdAt ? (dbUser as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: dbUser.updatedAt ? (dbUser as any).updatedAt.toISOString() : new Date().toISOString(),
          organizationId: dbUser.organizationId
        },
        token: accessToken,
        refreshToken: refreshToken
      }
    });

    setAuthCookies(response, accessToken, refreshToken);
    return response;

  } catch (error: any) {
    console.error('[Login] FATAL ERROR:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { endpoint: 'auth' });
