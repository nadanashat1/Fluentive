import { NextRequest } from "next/server";
import { getUserFromToken } from "./auth";

export interface TenantContext {
  userId: string;
  organizationId: string;
  role: string;
}

/**
 * Extracts tenant context from authenticated user
 * Every API route should use this to get organization isolation
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext | null> {
  const user = await getUserFromToken();
  
  if (!user) {
    return null;
  }
  
  if (!user.organizationId) {
    console.error(`[Tenant] User ${user.id} has no organization assigned`);
    return null;
  }
  
  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role as string
  };
}

/**
 * Middleware helper to require tenant context
 * Use this for protected tenant-aware routes
 */
export async function requireTenantContext(req: NextRequest): Promise<TenantContext> {
  const context = await getTenantContext(req);
  
  if (!context) {
    throw new Error("Unauthorized or no organization assigned");
  }
  
  return context;
}
