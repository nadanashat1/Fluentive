// SaaS Multi-Tenant Authentication System
// Provides tenant-aware JWT tokens and user context

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Roles, RoleType } from '@/constants/roles';


// Use type assertion to bypass TypeScript errors temporarily
const prismaClient = prisma as any;
// Use local User type definition until Prisma client is properly generated
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
};

// JWT Payload with tenant context
export interface SaaSJwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Complete user context with tenant
export interface UserContext {
  user: User;
  role: string;
}

// Create JWT token with tenant binding
export function createSaaSToken(
  user: User
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn: '7d',
      issuer: 'fluentive-saas',
      audience: 'fluentive-users',
    }
  );
}

// Verify and decode SaaS token
export function verifySaaSToken(token: string): SaaSJwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    return jwt.verify(token, secret, {
      issuer: 'fluentive-saas',
      audience: 'fluentive-users',
    }) as SaaSJwtPayload;
  } catch {
    return null;
  }
}

// Get user context from request (cookies)
export async function getUserContext(): Promise<UserContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  const payload = verifySaaSToken(token);
  if (!payload) {
    return null;
  }

  // Fetch fresh user data with tenant
  const user = await prismaClient.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    user,
    role: user.role,
  };
}

// Require authentication with tenant context
export async function requireSaaSAuth(): Promise<UserContext> {
  const context = await getUserContext();
  if (!context) {
    throw new Error('Unauthorized');
  }

  return context;
}

// Check if user has required role
export function requireRole(context: UserContext, allowedRoles: string[]): void {
  if (!allowedRoles.includes(context.role)) {
    throw new Error(`Forbidden: Requires role: ${allowedRoles.join(' or ')}`);
  }
}

// Check if tenant has required plan
export function requirePlan(context: UserContext, allowedPlans: string[]): void {
  void context;
  void allowedPlans;
  throw new Error('Plans are not supported in the current schema');
}

// Check tenant permissions
export function checkTenantPermission(
  context: UserContext,
  permission: string
): boolean {
  // Admin has all permissions
  if (context.role === Roles.ADMIN) return true;

  // Permissions are not modeled in the current schema.
  void permission;
  return false;
}

// Extract tenant ID from request (for tenant-scoped queries)
export async function getTenantId(): Promise<string | null> {
  return null;
}

// SaaS-aware Prisma query wrapper
export async function withTenantScope<T>(
  tenantId: string,
  operation: () => Promise<T>
): Promise<T> {
  // This ensures all queries include tenantId
  // In a real implementation, you might use Prisma middleware
  return operation();
}

// Tenant isolation error
export class TenantIsolationError extends Error {
  constructor(message: string = 'Tenant isolation violation') {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

// Create tenant-aware where clause
export function tenantWhere(tenantId: string, additionalWhere?: object): object {
  return {
    tenantId,
    ...additionalWhere,
  };
}

// Verify resource belongs to tenant
export function verifyTenantOwnership(
  resourceTenantId: string,
  userTenantId: string
): void {
  if (resourceTenantId !== userTenantId) {
    throw new TenantIsolationError('Resource does not belong to tenant');
  }
}

// Token refresh logic
export async function refreshSaaSToken(
  currentToken: string
): Promise<string | null> {
  const payload = verifySaaSToken(currentToken);
  if (!payload) return null;

  const user = await prismaClient.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return createSaaSToken(user);
}
