// Simple Tenant Middleware - Stripe-style middleware-based enforcement
import { NextRequest, NextResponse } from 'next/server';

import { TenantService } from '@/lib/tenant/tenant-context';
import { TenantRateLimiter } from '@/lib/rate-limiting/tenant-rate-limiter';
import { logger } from '@/lib/observability/logger';
import { Roles, RoleType } from '@/constants/roles';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
  plan: 'free' | 'pro' | 'enterprise';
}

// Simple middleware for tenant resolution and rate limiting
export async function withTenant(
  request: NextRequest,
  handler: (context: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Get user from auth (simplified)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Resolve tenant (simplified - would come from subdomain or header)
    const tenantId = user.organization || 'default-tenant';
    
    // Get tenant info
    const tenant = await TenantService.getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check user access to tenant
    const hasAccess = await TenantService.getUserTenantAccess(user.id, tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get user permissions
    const permissions = await TenantService.getUserPermissions(user.id, tenantId);

    // Create tenant context
    const context: TenantContext = {
      tenantId,
      userId: user.id,
      role: user.role,
      permissions,
      plan: tenant.subscription.plan,
    };

    // Apply rate limiting (simple, non-blocking)
    const rateLimitResult = await TenantRateLimiter.checkUserRateLimit(
      tenantId,
      user.id,
      request.nextUrl.pathname,
      tenant.subscription.plan
    );

    // Add rate limit headers
    const response = await handler(context);
    
    response.headers.set('X-RateLimit-Limit', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    // Log request (async, non-blocking)
    logRequest(context, request, startTime, response.status || 200);

    return response;
  } catch (error) {
    logger.error('tenant-middleware', 'Middleware error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simple auth helper (would use real auth system)
async function getUserFromRequest(request: NextRequest): Promise<any> {
  // This would use your existing auth system
  // For now, return a placeholder
  return {
    id: 'user-123',
    role: Roles.ADMIN,
    organization: 'default-tenant'
  };
}

// Async logging (non-blocking)
async function logRequest(
  context: TenantContext,
  request: NextRequest,
  startTime: number,
  status: number
): Promise<void> {
  try {
    const duration = Date.now() - startTime;
    
    // Fire-and-forget logging (non-blocking)
    setImmediate(() => {
      logger.info('tenant-middleware', 'Request completed', {
        tenantId: context.tenantId,
        userId: context.userId,
        path: request.nextUrl.pathname,
        method: request.method,
        status,
        duration,
      });
    });
  } catch (error) {
    // Don't let logging errors break requests
    console.error('Logging error:', error);
  }
}

// Rate limiting middleware (optional)
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Simple rate limiting check
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const key = `global:${ip}:${request.nextUrl.pathname}`;
    
    // This would use your rate limiting system
    // For now, just pass through
    return await handler();
  } catch (error) {
    logger.error('rate-limit-middleware', 'Rate limit error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Rate limit error' },
      { status: 500 }
    );
  }
}

// Auth middleware (simple)
export async function withAuth(
  request: NextRequest,
  handler: (user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return await handler(user);
  } catch (error) {
    logger.error('auth-middleware', 'Auth error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Auth error' },
      { status: 500 }
    );
  }
}
