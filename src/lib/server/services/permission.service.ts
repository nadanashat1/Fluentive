import { Roles, RoleType } from '@/constants/roles';


/**
 * ENTERPRISE PERMISSION SYSTEM
 * Standardized RBAC + ABAC for the entire operating system.
 */

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'MANAGE_SYSTEM';
export type ResourceType = 'LEAD' | 'DEAL' | 'EMPLOYEE' | 'FINANCE' | 'HR' | 'MARKETING' | 'ADMIN' | 'LMS';

interface UserPermissions {
  role: RoleType;
  departmentId?: string;
}

/**
 * PERMISSION MATRIX
 * Defines which roles have which base capabilities.
 */
const ROLE_PERMISSIONS: Record<RoleType, Partial<Record<ResourceType, PermissionAction[]>>> = {
  [Roles.SUPER_ADMIN]: {
    ADMIN: ['MANAGE_SYSTEM'],
    LEAD: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    DEAL: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    EMPLOYEE: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    FINANCE: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    HR: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    MARKETING: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    LMS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
  },
  [Roles.ADMIN]: {
    LEAD: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    DEAL: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    EMPLOYEE: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    FINANCE: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    HR: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    MARKETING: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    ADMIN: ['MANAGE_SYSTEM'],
    LMS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
  },
  [Roles.MANAGER]: {
    LEAD: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    DEAL: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'],
    EMPLOYEE: ['READ', 'UPDATE'],
    FINANCE: ['READ'],
    HR: ['READ'],
    MARKETING: ['READ'],
    LMS: ['READ'],
  },
  [Roles.SALES]: {
    LEAD: ['CREATE', 'READ', 'UPDATE'],
    DEAL: ['CREATE', 'READ', 'UPDATE'],
  },
  [Roles.HR]: {
    EMPLOYEE: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    HR: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
  },
  [Roles.FINANCE]: {
    FINANCE: ['CREATE', 'READ', 'UPDATE', 'EXPORT'],
    DEAL: ['READ'],
  },
  [Roles.MARKETING]: {
    MARKETING: ['CREATE', 'READ', 'UPDATE', 'EXPORT'],
    LEAD: ['READ', 'CREATE'],
  },
  [Roles.INSTRUCTOR]: {
    LMS: ['CREATE', 'READ', 'UPDATE'],
  },
  [Roles.EMPLOYEE]: {
    LEAD: ['READ'],
    LMS: ['READ'],
  },
  [Roles.USER]: {
    LEAD: ['READ'],
  },
};

export const checkPermission = (
  user: UserPermissions,
  resource: ResourceType,
  action: PermissionAction
): boolean => {
  const permissions = ROLE_PERMISSIONS[user.role];
  if (!permissions) return false;

  const allowedActions = permissions[resource];
  if (!allowedActions) return false;

  return allowedActions.includes(action) || (allowedActions as any).includes('MANAGE_SYSTEM');
};

/**
 * Higher-order helper for API route guards.
 */
export const validateAccess = (user: { role: RoleType }, resource: ResourceType, action: PermissionAction) => {
  if (!checkPermission(user, resource, action)) {
    throw new Error(`Access Denied: Insufficient permissions for ${action} on ${resource}`);
  }
};
