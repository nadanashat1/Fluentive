import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * TEMPORARY: Seed admin user for development
 * POST /api/debug/seed-user
 * Body: { email, password, name }
 * DELETE THIS AFTER SETUP
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'email and password required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 });
    }

    // Create organization first
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Fluentive',
          slug: 'fluentive',
          isActive: true,
          settings: {},
          metadata: {}
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Admin',
        role: 'admin',
        organizationId: org.id,
        isActive: true,
        isDeleted: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error: any) {
    console.error('[Seed] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
