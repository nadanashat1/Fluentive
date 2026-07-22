// 🛡️ Centralized Permission System
// Replace all role string comparisons with permission-based checks

export const PERMISSIONS = {
  // User Management
  USERS_READ: "users.read",
  USERS_MANAGE: "users.manage",
  USERS_CREATE: "users.create",
  USERS_DELETE: "users.delete",
  USERS_UNLOCK: "users.unlock",
  
  // Organization Management
  ORG_READ: "org.read",
  ORG_MANAGE: "org.manage",
  ORG_INVITE: "org.invite",
  ORG_CREATE: "org.create",
  
  // Analytics & Reports
  ANALYTICS_READ: "analytics.read",
  ANALYTICS_EXPORT: "analytics.export",
  
  // Time Tracking
  TIME_TRACKING_READ: "timetracking.read",
  TIME_TRACKING_MANAGE: "timetracking.manage",
  TIME_TRACKING_ALL: "timetracking.all", // View all users' time
  
  // Security & Audit
  SECURITY_READ: "security.read",
  SECURITY_MANAGE: "security.manage",
  AUDIT_LOG: "audit.log",
  
  // Leads & Deals
  LEADS_READ: "leads.read",
  LEADS_MANAGE: "leads.manage",
  LEADS_CREATE: "leads.create",
  LEADS_DELETE: "leads.delete",
  
  // Deals Management
  DEALS_READ: "deals.read",
  DEALS_MANAGE: "deals.manage",
  DEALS_CREATE: "deals.create",
  DEALS_DELETE: "deals.delete",
  
  // Notifications
  NOTIFICATIONS_READ: "notifications.read",
  NOTIFICATIONS_MANAGE: "notifications.manage",
  
  // System Administration
  SYSTEM_ADMIN: "system.admin",
  SYSTEM_MAINTENANCE: "system.maintenance",
} as const;

// Permission levels for hierarchical checks
export const PERMISSION_LEVELS = {
  [PERMISSIONS.USERS_READ]: 1,
  [PERMISSIONS.USERS_MANAGE]: 2,
  [PERMISSIONS.USERS_CREATE]: 2,
  [PERMISSIONS.USERS_DELETE]: 3,
  [PERMISSIONS.USERS_UNLOCK]: 2,
  
  [PERMISSIONS.ORG_READ]: 1,
  [PERMISSIONS.ORG_MANAGE]: 2,
  [PERMISSIONS.ORG_INVITE]: 2,
  [PERMISSIONS.ORG_CREATE]: 3,
  
  [PERMISSIONS.ANALYTICS_READ]: 1,
  [PERMISSIONS.ANALYTICS_EXPORT]: 2,
  
  [PERMISSIONS.TIME_TRACKING_READ]: 1,
  [PERMISSIONS.TIME_TRACKING_MANAGE]: 2,
  [PERMISSIONS.TIME_TRACKING_ALL]: 3,
  
  [PERMISSIONS.SECURITY_READ]: 2,
  [PERMISSIONS.SECURITY_MANAGE]: 3,
  [PERMISSIONS.AUDIT_LOG]: 3,
  
  [PERMISSIONS.LEADS_READ]: 1,
  [PERMISSIONS.LEADS_MANAGE]: 2,
  [PERMISSIONS.LEADS_CREATE]: 2,
  [PERMISSIONS.LEADS_DELETE]: 3,
  
  [PERMISSIONS.DEALS_READ]: 1,
  [PERMISSIONS.DEALS_MANAGE]: 2,
  [PERMISSIONS.DEALS_CREATE]: 2,
  [PERMISSIONS.DEALS_DELETE]: 3,
  
  [PERMISSIONS.NOTIFICATIONS_READ]: 1,
  [PERMISSIONS.NOTIFICATIONS_MANAGE]: 2,
  
  [PERMISSIONS.SYSTEM_ADMIN]: 4,
  [PERMISSIONS.SYSTEM_MAINTENANCE]: 3,
} as const;

// Role to permission mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Sales users can manage their own leads and deals
  SALES: [
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.DEALS_READ,
    PERMISSIONS.DEALS_CREATE,
    PERMISSIONS.TIME_TRACKING_READ,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
  
  // Managers can manage team and view analytics
  MANAGER: [
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_MANAGE,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.DEALS_READ,
    PERMISSIONS.DEALS_MANAGE,
    PERMISSIONS.DEALS_CREATE,
    PERMISSIONS.TIME_TRACKING_READ,
    PERMISSIONS.TIME_TRACKING_MANAGE,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.NOTIFICATIONS_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_INVITE,
  ],
  
  // Admins have full access
  ADMIN: Object.values(PERMISSIONS) as Permission[],
  
  // Super admin for system-level operations
  SUPER_ADMIN: Object.values(PERMISSIONS) as Permission[],
};

// Type definitions
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type Role = keyof typeof ROLE_PERMISSIONS;

// Helper functions
export function hasPermission(userRole: string | null, permission: Permission): boolean {
  if (!userRole || typeof userRole !== 'string') return false;
  
  // Normalize role to handle variations
  const normalizedRole = userRole.toUpperCase().replace(' ', '_');
  
  // Get permissions for role
  const rolePerms = ROLE_PERMISSIONS[normalizedRole as Role] || [];
  
  return Array.isArray(rolePerms) && rolePerms.includes(permission);
}

export function hasAnyPermission(userRole: string | null, permissions: Permission[]): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: string | null, permissions: Permission[]): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function getPermissionsForRole(role: string): Permission[] {
  if (!role || typeof role !== 'string') return [];
  const normalizedRole = role.toUpperCase().replace(' ', '_');
  return ROLE_PERMISSIONS[normalizedRole as Role] || [];
}

// Check if user has permission level or higher
export function hasPermissionLevel(userRole: string | null, permission: Permission): boolean {
  if (!userRole) return false;
  
  const userPermissions = getPermissionsForRole(userRole);
  const requiredLevel = PERMISSION_LEVELS[permission] || 0;
  
  if (!Array.isArray(userPermissions)) return false;
  
  return userPermissions.some(perm => {
    if (!perm) return false;
    const userLevel = PERMISSION_LEVELS[perm as Permission] || 0;
    return userLevel >= requiredLevel;
  });
}
