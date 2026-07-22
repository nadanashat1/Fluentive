import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password-service';
import { generateAuthTokens, setAuthCookies } from '@/lib/server/auth';
import { Roles } from '@/constants/roles';
import { withRateLimit } from '@/lib/server/rate-limiter';

/**
 * ENTERPRISE REGISTRATION API
 * Creates a new user and an associated organization.
 */
export const POST = withRateLimit(async (request: Request) => {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'This email is already registered' },
        { status: 400 }
      );
    }

    // 2. Hash password
    const hashedPassword = await hashPassword(password);

    // 3. Create user and organization in a transaction
    const dbUser = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: `${name}'s Organization`,
          slug: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
        }
      });

      return tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: Roles.ADMIN, // First user is Admin
          organizationId: org.id,
          isActive: true
        }
      });
    });

    // 4. Generate tokens
    const { accessToken, refreshToken } = await generateAuthTokens(
      dbUser.id,
      dbUser.organizationId
    );

    // 5. Store session
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await prisma.session.create({
      data: {
        userId: dbUser.id,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });

    // 6. Build response
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
    }, { status: 201 });

    setAuthCookies(response, accessToken, refreshToken);
    return response;

  } catch (error: any) {
    console.error('[Register] FATAL ERROR:', error.message);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}, { endpoint: 'auth' });
