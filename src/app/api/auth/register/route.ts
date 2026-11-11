import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password-service';
import { validEmail, validPassword, allowAuthEmail, sendAuthEmail } from '@/lib/server/auth-email';
import { Roles } from '@/constants/roles';
import { withRateLimit } from '@/lib/server/rate-limiter';

/**
 * ENTERPRISE REGISTRATION API
 * Creates a new user and an associated organization.
 */
export const POST = withRateLimit(async (request: Request) => {
  try {
    const { name, email, password } = await request.json();

    if (typeof name !== 'string' || !name.trim() || name.length > 100 || !validEmail(email) || !validPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!await allowAuthEmail(request, normalizedEmail)) return NextResponse.json({ success: false, error: 'Too many email requests. Try again later.' }, { status: 429 });

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      if (!existingUser.emailVerified && existingUser.isActive && !existingUser.isDeleted) await sendAuthEmail(existingUser.id, normalizedEmail, 'verify');
      return NextResponse.json({ success: true, data: { verificationRequired: true } }, { status: 202 });
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
          isActive: true,
          emailVerified: false
        }
      });
    });

    await sendAuthEmail(dbUser.id, normalizedEmail, 'verify');
    return NextResponse.json({ success: true, data: { verificationRequired: true } }, { status: 201 });

  } catch (error: any) {
    console.error('[Register] FATAL ERROR:', error.message);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}, { endpoint: 'auth' });
