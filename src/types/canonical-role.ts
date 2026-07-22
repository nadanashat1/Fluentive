/**
 * Canonical role definitions - SINGLE SOURCE OF TRUTH
 * Aligned with enterprise RoleType constants.
 */

import { RoleType, Roles } from '@/constants/roles';

export type CanonicalRole = RoleType;

/**
 * Normalize any role string to canonical format
 * Maps various casing and naming conventions to standard RoleType values.
 */
export function normalizeRole(role: string): CanonicalRole {
  if (!role || typeof role !== 'string') return Roles.USER;
  
  const upper = role.toUpperCase();
  
  // Exact matches for RoleType values (case-insensitive)
  if (upper === 'ADMIN') return Roles.ADMIN;
  if (upper === 'MANAGER') return Roles.MANAGER;
  if (upper === 'SALES') return Roles.SALES;
  if (upper === 'MARKETING') return Roles.MARKETING;
  if (upper === 'HR') return Roles.HR;
  if (upper === 'FINANCE') return Roles.FINANCE;
  if (upper === 'INSTRUCTOR') return Roles.INSTRUCTOR;
  if (upper === 'EMPLOYEE') return Roles.EMPLOYEE;
  if (upper === 'SUPER_ADMIN') return Roles.SUPER_ADMIN;
  if (upper === 'USER') return Roles.USER;

  // Legacy mappings
  if (upper === "SALES_ADMIN_MANAGER") return Roles.ADMIN;
  
  // Fuzzy matching for common roles
  if (upper.includes("ADMIN")) return Roles.ADMIN;
  if (upper.includes("MANAGER")) return Roles.MANAGER;
  if (upper.includes("SALES")) return Roles.SALES;
  
  return Roles.USER; // default fallback
}

/**
 * DEPRECATED: Use hasPermission from permissions.ts instead
 * These functions are kept for backward compatibility during migration
 */
import { hasPermission } from '@/lib/permissions';

/**
 * Check if user has admin-level access
 */
export function hasAdminAccess(role: string): boolean {
  return hasPermission(role, "users.manage");
}

/**
 * Check if user has sales-level access
 */
export function hasSalesAccess(role: string): boolean {
  return hasPermission(role, "leads.read");
}
