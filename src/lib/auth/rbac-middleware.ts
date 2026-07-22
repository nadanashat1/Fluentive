// Role-Based Access Control (RBAC) Middleware
// Clean, enterprise-grade authorization system

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { Roles, RoleType } from '@/constants/roles';


export type Permission = 
  | 'read:own_profile'
  | 'edit:own_profile'
  | 'read:all_users'
  | 'edit:all_users'
  | 'delete:users'
  | 'read:analytics'
  | 'manage:organization'
  | 'read:all_leads'
  | 'edit:all_leads'
  | 'delete:leads'
  | 'read:all_deals'
  | 'edit:all_deals'
  | 'delete:deals';

// Role permissions mapping
const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  [Roles.USER]: [
    'read:own_profile',
    'edit:own_profile'
  ],
  [Roles.SALES]: [
    'read:own_profile',
    'edit:own_profile',
    'read:all_leads',
    'edit:all_leads',
    'read:all_deals',
    'edit:all_deals'
  ],
  [Roles.MARKETING]: [
    'read:own_profile',
    'edit:own_profile',
    'read:all_leads',
    'edit:all_leads'
  ],
  [Roles.HR]: [
    'read:own_profile',
    'edit:own_profile',
    'read:all_users',
    'edit:all_users'
  ],
  [Roles.FINANCE]: [
    'read:own_profile',
    'edit:own_profile',
    'read:all_deals'
  ],
  [Roles.INSTRUCTOR]: [
    'read:own_profile',
    'edit:own_profile'
  ],
  [Roles.EMPLOYEE]: [
    'read:own_profile',
    'edit:own_profile'
  ],
  [Roles.MANAGER]: [
    'read:own_profile',
    'edit:own_profile',
    'read:all_users',
    'edit:all_users',
    'read:analytics',
    'read:all_leads',
    'edit:all_leads',
    'delete:leads',
    'read:all_deals',
    'edit:all_deals',
    'delete:deals'
  ],
  [Roles.ADMIN]: [
    // Admin has all permissions
    'read:own_profile',
    'edit:own_profile',
    'read:all_users',
    'edit:all_users',
    'delete:users',
    'read:analytics',
    'manage:organization',
    'read:all_leads',
    'edit:all_leads',
    'delete:leads',
    'read:all_deals',
    'edit:all_deals',
    'delete:deals'
  ],
  [Roles.SUPER_ADMIN]: [
    // Super Admin has all permissions
    'read:own_profile',
    'edit:own_profile',
    'read:all_users',
    'edit:all_users',
    'delete:users',
    'read:analytics',
    'manage:organization',
    'read:all_leads',
    'edit:all_leads',
    'delete:leads',
    'read:all_deals',
    'edit:all_deals',
    'delete:deals'
  ]
};

export class RBAC {
  // Check if user has specific permission
  static hasPermission(userRole: RoleType, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  static hasAnyPermission(userRole: RoleType, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  // Check if user has all specified permissions
  static hasAllPermissions(userRole: RoleType, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  // Get all permissions for a role
  static getRolePermissions(userRole: RoleType): Permission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  // Check if role can access resource
  static canAccessResource(userRole: RoleType, resource: string, action: string): boolean {
    const permission = `${action}:${resource}` as Permission;
    return this.hasPermission(userRole, permission);
  }
}

// Middleware factory for role-based protection
export function createRoleGuard(requiredPermissions: Permission[]) {
  return async (request: NextRequest) => {
    try {
      const user = await getUserFromRequest(request);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userRole = user.role as RoleType;
      const hasPermission = RBAC.hasAnyPermission(userRole, requiredPermissions);

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // User has required permissions, continue
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Authorization check failed' },
        { status: 500 }
      );
    }
  };
}

// Helper function for route-level permission checks
export function requirePermission(userRole: RoleType, permission: Permission): void {
  if (!RBAC.hasPermission(userRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`);
  }
}

// Helper function for multiple permission checks
export function requireAnyPermission(userRole: RoleType, permissions: Permission[]): void {
  if (!RBAC.hasAnyPermission(userRole, permissions)) {
    throw new Error(`Insufficient permissions. Required one of: ${permissions.join(', ')}`);
  }
}

// Helper function for all permissions check
export function requireAllPermissions(userRole: RoleType, permissions: Permission[]): void {
  if (!RBAC.hasAllPermissions(userRole, permissions)) {
    throw new Error(`Insufficient permissions. Required all of: ${permissions.join(', ')}`);
  }
}
