/**
 * Enterprise RBAC v2 - Permission-based access control
 * Single source of truth for role-to-permission mapping
 */

import { normalizeRole } from '@/types/canonical-role';
import { Roles, RoleType } from '@/constants/roles';

export type Permission = 
  // Lead management
  | "leads.read"
  | "leads.create" 
  | "leads.update"
  | "leads.delete"
  // Deal management
  | "deals.read"
  | "deals.create"
  | "deals.update"
  | "deals.delete"
  // User management
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.manage"
  // Analytics
  | "analytics.view"
  | "analytics.export"
  // Organization management
  | "org.read"
  | "org.update"
  | "org.manage"
  // Admin system
  | "admin.system"
  | "admin.security"
  | "admin.audit";

/**
 * Role-to-permission mapping
 * Roles are just labels, permissions control access
 */
export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  [Roles.USER]: [
    "org.read",
  ],
  [Roles.SALES]: [
    "leads.read",
    "leads.create",
    "leads.update",
    "deals.read",
    "deals.create",
    "deals.update",
    "users.read",
    "org.read",
    "analytics.view",
  ],
  [Roles.MARKETING]: [
    "leads.read",
    "leads.create",
    "leads.update",
    "org.read",
    "analytics.view",
  ],
  [Roles.HR]: [
    "users.read",
    "users.create",
    "users.update",
    "users.manage",
    "org.read",
  ],
  [Roles.FINANCE]: [
    "deals.read",
    "org.read",
    "analytics.view",
  ],
  [Roles.INSTRUCTOR]: [
    "org.read",
  ],
  [Roles.EMPLOYEE]: [
    "org.read",
  ],
  [Roles.MANAGER]: [
    "leads.read",
    "leads.create", 
    "leads.update",
    "leads.delete",
    "deals.read",
    "deals.create",
    "deals.update",
    "deals.delete",
    "users.read",
    "users.create",
    "users.update",
    "analytics.view",
    "analytics.export",
    "org.read",
    "org.update",
  ],
  [Roles.ADMIN]: [
    "leads.read", "leads.create", "leads.update", "leads.delete",
    "deals.read", "deals.create", "deals.update", "deals.delete",
    "users.read", "users.create", "users.update", "users.manage",
    "analytics.view", "analytics.export",
    "org.read", "org.update", "org.manage",
    "admin.system", "admin.security", "admin.audit",
  ],
  [Roles.SUPER_ADMIN]: [
    "leads.read", "leads.create", "leads.update", "leads.delete",
    "deals.read", "deals.create", "deals.update", "deals.delete",
    "users.read", "users.create", "users.update", "users.manage",
    "analytics.view", "analytics.export",
    "org.read", "org.update", "org.manage",
    "admin.system", "admin.security", "admin.audit",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  if (!role || typeof role !== 'string') return false;
  const normalized = normalizeRole(role);
  const rolePerms = ROLE_PERMISSIONS[normalized as RoleType];
  return Array.isArray(rolePerms) && rolePerms.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  if (!role || typeof role !== 'string') return [];
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS[normalized as RoleType] ?? [];
}
