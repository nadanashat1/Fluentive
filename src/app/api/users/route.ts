import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';
import { AuditLogger, AUDIT_ACTIONS } from '@/lib/audit/audit-logger';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse, validateResponseSize } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { hashPassword } from '@/lib/auth/password-service';

export const POST = withRateLimit(
  withMemoryCheck(async (request: Request) => {
    try {
      const { user: authUser, error: authErr } = await requireAuth(request);
      if (authErr || !authUser) {
        return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
      }

      if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
        return NextResponse.json({ status: "error", message: "Forbidden: Only admins can create users" }, { status: 403 });
      }

      const body = await request.json();
      const { name, email, password, role, organizationId } = body;

      if (!name || !email || !password) {
        return NextResponse.json(
          { status: "error", message: "Name, email, and password are required." },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { status: "error", message: "A user with this email already exists." },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: role ? role.toLowerCase() : "user",
          // Tenant isolation: new users always join the caller's organization.
          organizationId: authUser.organizationId || undefined,
        },
      });

      return NextResponse.json(
        { status: "success", message: "User created successfully.", data: user },
        { status: 201 }
      );
    } catch (error) {
      console.error("[users.route.POST]", error);
      return NextResponse.json(
        { status: "error", message: "Failed to create user." },
        { status: 500 }
      );
    }
  }), { endpoint: 'users' }
);

export const GET = withRateLimit(
  withMemoryCheck(async (request: Request) => {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await AuditLogger.logUserAction(user as any, AUDIT_ACTIONS.USER_UPDATED, undefined, request as any);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');

    // Tenant isolation: only users in the caller's organization.
    const where: any = { organizationId: user.organizationId ?? '' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    let [users, total] = await withTimeout(Promise.all([
      (prisma as any).user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          loginAttemptCount: true,
          lockUntil: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      (prisma as any).user.count({ where })
    ]), 15000);

    const responseData = {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };

    const sizeCheck = validateResponseSize(responseData);
    return createCompressedResponse(responseData, 200, {
      'X-Response-Size': `${sizeCheck.sizeKB}KB`,
      ...(sizeCheck.warning && { 'X-Size-Warning': sizeCheck.warning })
    });
  } catch (error) {
    return createCompressedResponse({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch users'
    }, error instanceof Error && error.message === 'Unauthorized' ? 401 : 500);
  }
}), { endpoint: 'users' });
