/**
 * Role normalization utility functions
 * Handles all role variations (uppercase, lowercase, combined)
 * 
 * DEPRECATED: Use canonical-role.ts and permissions.ts instead
 * This file is kept for backward compatibility during migration
 */

import { hasPermission } from '@/lib/permissions';
import { normalizeRole as canonicalNormalizeRole } from '@/types/canonical-role';

export type NormalizedRole = 'admin' | 'manager' | 'sales';

/**
 * DEPRECATED: Use normalizeRole from canonical-role.ts instead
 */
export function normalizeRole(role: string): NormalizedRole {
  const canonical = canonicalNormalizeRole(role);
  
  // Map canonical roles to legacy normalized roles
  if (canonical === 'admin') return 'admin';
  if (canonical === 'manager') return 'admin'; // Legacy mapped manager to admin often
  if (canonical === 'sales') return 'sales';
  
  return 'sales'; // default
}

/**
 * DEPRECATED: Use hasPermission from permissions.ts instead
 */
export function hasAdminAccess(role: string): boolean {
  return hasPermission(role, "users.manage");
}

/**
 * DEPRECATED: Use hasPermission from permissions.ts instead
 */
export function hasManagerAccess(role: string): boolean {
  return hasPermission(role, "users.manage") || hasPermission(role, "org.update");
}

/**
 * DEPRECATED: Use hasPermission from permissions.ts instead
 */
export function hasRolePermission(userRole: string, requiredRole: NormalizedRole): boolean {
  const normalized = normalizeRole(userRole);
  return normalized === requiredRole;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const normalized = normalizeRole(role);
  const displayNames = {
    'admin': 'Administrator',
    'manager': 'Manager',
    'sales': 'Sales Agent'
  };
  return displayNames[normalized] || 'User';
}
