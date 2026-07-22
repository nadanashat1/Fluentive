/**
 * UI layer user utilities
 * These functions normalize user data for display purposes only
 * They do NOT affect the backend contract or core auth logic
 */

import { normalizeRole } from '@/types/canonical-role';
import { hasPermission } from '@/lib/permissions';

// Flexible user type that works with both backend and frontend User types
type FlexibleUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string | Date;
  organizationId?: string | null;
  [key: string]: any;
};

/**
 * Get normalized user data for UI components
 * This is the proper way to normalize user data in the UI layer
 */
export function getNormalizedUser(user: FlexibleUser | null) {
  if (!user) return null;
  
  return {
    ...user,
    role: normalizeRole(user.role),
    // Ensure createdAt is always a string to match User type requirements
    createdAt: user.createdAt ? (typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString()) : new Date().toISOString(),
  };
}

/**
 * Check if current user has specific permission (UI-friendly)
 */
export function userHasPermission(user: FlexibleUser | null, permission: string): boolean {
  if (!user || !user.role) return false;
  return hasPermission(user.role, permission as any);
}

/**
 * Get user's permissions list (for UI display)
 */
export function getUserPermissions(user: FlexibleUser | null) {
  if (!user || !user.role) return [];
  const { getRolePermissions } = require('@/lib/permissions');
  return getRolePermissions(user.role);
}

/**
 * Check if user can perform admin actions (UI helper)
 */
export function userCanManageUsers(user: FlexibleUser | null): boolean {
  return userHasPermission(user, "users.manage");
}

/**
 * Check if user can view analytics (UI helper)
 */
export function userCanViewAnalytics(user: FlexibleUser | null): boolean {
  return userHasPermission(user, "analytics.view");
}

/**
 * Check if user can manage organization (UI helper)
 */
export function userCanManageOrganization(user: FlexibleUser | null): boolean {
  return userHasPermission(user, "org.manage");
}
