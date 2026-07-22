import { DomainUser, Permission, RuleResult, DomainEvent } from '../shared/types';
import { Roles, RoleType } from '@/constants/roles';

// Authorization Kernel - Enforces Access Control
export class AuthorizationKernel {
  
  // Role-based permissions matrix
  private static rolePermissions: Record<RoleType, Permission[]> = {
    [Roles.USER]: [
      Permission.READ_LEADS,
      Permission.WRITE_LEADS,
      Permission.READ_DEALS,
      Permission.WRITE_DEALS
    ],
    [Roles.SALES]: [
      Permission.READ_LEADS,
      Permission.WRITE_LEADS,
      Permission.DELETE_LEADS,
      Permission.READ_DEALS,
      Permission.WRITE_DEALS,
      Permission.DELETE_DEALS,
      Permission.CONVERT_LEADS
    ],
    [Roles.MARKETING]: [
      Permission.READ_LEADS,
      Permission.WRITE_LEADS,
      Permission.READ_DEALS
    ],
    [Roles.HR]: [
      Permission.MANAGE_USERS
    ],
    [Roles.FINANCE]: [
      Permission.READ_DEALS
    ],
    [Roles.INSTRUCTOR]: [
      Permission.READ_LEADS
    ],
    [Roles.EMPLOYEE]: [
      Permission.READ_LEADS
    ],
    [Roles.MANAGER]: [
      Permission.READ_LEADS,
      Permission.WRITE_LEADS,
      Permission.DELETE_LEADS,
      Permission.READ_DEALS,
      Permission.WRITE_DEALS,
      Permission.DELETE_DEALS,
      Permission.CONVERT_LEADS,
      Permission.MANAGE_USERS
    ],
    [Roles.ADMIN]: [
      Permission.READ_LEADS,
      Permission.WRITE_LEADS,
      Permission.DELETE_LEADS,
      Permission.READ_DEALS,
      Permission.WRITE_DEALS,
      Permission.DELETE_DEALS,
      Permission.CONVERT_LEADS,
      Permission.MANAGE_USERS
    ],
    [Roles.SUPER_ADMIN]: [
      Permission.READ_LEADS,
      Permission.WRITE_LEADS,
      Permission.DELETE_LEADS,
      Permission.READ_DEALS,
      Permission.WRITE_DEALS,
      Permission.DELETE_DEALS,
      Permission.CONVERT_LEADS,
      Permission.MANAGE_USERS
    ]
  };

  // Permission checking
  static hasPermission(user: DomainUser, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }

  static hasRole(user: DomainUser, role: RoleType): boolean {
    return user.role === role;
  }

  static hasMinimumRole(user: DomainUser, minimumRole: RoleType): boolean {
    const roleHierarchy: Record<RoleType, number> = {
      [Roles.USER]: 0,
      [Roles.EMPLOYEE]: 0,
      [Roles.INSTRUCTOR]: 1,
      [Roles.SALES]: 1,
      [Roles.MARKETING]: 1,
      [Roles.FINANCE]: 2,
      [Roles.HR]: 2,
      [Roles.MANAGER]: 2,
      [Roles.ADMIN]: 3,
      [Roles.SUPER_ADMIN]: 4
    };

    return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
  }

  // Resource ownership validation
  static validateOwnership(resourceOwnerId: string, currentUserId: string, userRole: RoleType): RuleResult {
    // Users can only access their own resources
    if (resourceOwnerId !== currentUserId) {
      // Managers and admins can access any resource in workspace
      if (userRole !== Roles.MANAGER && userRole !== Roles.ADMIN) {
        return {
          isValid: false,
          error: 'User does not have permission to access this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        };
      }
    }

    return { isValid: true };
  }

  // Workspace isolation validation
  static validateWorkspaceAccess(userWorkspaceId: string, resourceWorkspaceId: string): RuleResult {
    if (userWorkspaceId !== resourceWorkspaceId) {
      return {
        isValid: false,
        error: 'User does not have access to this workspace',
        code: 'WORKSPACE_ACCESS_DENIED'
      };
    }

    return { isValid: true };
  }

  // Cross-tenant prevention
  static validateTenantIsolation(user: DomainUser, resourceWorkspaceId: string): RuleResult {
    // Ensure user cannot access resources outside their workspace
    if (user.workspaceId !== resourceWorkspaceId) {
      return {
        isValid: false,
        error: 'Cross-tenant access is not allowed',
        code: 'CROSS_TENANT_ACCESS_BLOCKED'
      };
    }

    return { isValid: true };
  }

  // Operation-specific authorization
  static canCreateLead(user: DomainUser): RuleResult {
    const requiredPermission = Permission.WRITE_LEADS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to create leads',
        code: 'LEAD_CREATE_DENIED'
      };
    }

    return { isValid: true };
  }

  static canUpdateLead(user: DomainUser, leadOwnerId: string, leadWorkspaceId: string): RuleResult {
    const requiredPermission = Permission.WRITE_LEADS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to update leads',
        code: 'LEAD_UPDATE_DENIED'
      };
    }

    const ownershipResult = this.validateOwnership(leadOwnerId, user.id, user.role);
    if (!ownershipResult.isValid) {
      return ownershipResult;
    }

    const workspaceResult = this.validateWorkspaceAccess(user.workspaceId, leadWorkspaceId);
    if (!workspaceResult.isValid) {
      return workspaceResult;
    }

    return { isValid: true };
  }

  static canDeleteLead(user: DomainUser, leadOwnerId: string, leadWorkspaceId: string): RuleResult {
    const requiredPermission = Permission.DELETE_LEADS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to delete leads',
        code: 'LEAD_DELETE_DENIED'
      };
    }

    const ownershipResult = this.validateOwnership(leadOwnerId, user.id, user.role);
    if (!ownershipResult.isValid) {
      return ownershipResult;
    }

    const workspaceResult = this.validateWorkspaceAccess(user.workspaceId, leadWorkspaceId);
    if (!workspaceResult.isValid) {
      return workspaceResult;
    }

    return { isValid: true };
  }

  static canConvertLead(user: DomainUser): RuleResult {
    const requiredPermission = Permission.CONVERT_LEADS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to convert leads',
        code: 'LEAD_CONVERT_DENIED'
      };
    }

    return { isValid: true };
  }

  static canCreateDeal(user: DomainUser): RuleResult {
    const requiredPermission = Permission.WRITE_DEALS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to create deals',
        code: 'DEAL_CREATE_DENIED'
      };
    }

    return { isValid: true };
  }

  static canUpdateDeal(user: DomainUser, dealOwnerId: string, dealWorkspaceId: string): RuleResult {
    const requiredPermission = Permission.WRITE_DEALS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to update deals',
        code: 'DEAL_UPDATE_DENIED'
      };
    }

    const ownershipResult = this.validateOwnership(dealOwnerId, user.id, user.role);
    if (!ownershipResult.isValid) {
      return ownershipResult;
    }

    const workspaceResult = this.validateWorkspaceAccess(user.workspaceId, dealWorkspaceId);
    if (!workspaceResult.isValid) {
      return workspaceResult;
    }

    return { isValid: true };
  }

  static canDeleteDeal(user: DomainUser, dealOwnerId: string, dealWorkspaceId: string): RuleResult {
    const requiredPermission = Permission.DELETE_DEALS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to delete deals',
        code: 'DEAL_DELETE_DENIED'
      };
    }

    const ownershipResult = this.validateOwnership(dealOwnerId, user.id, user.role);
    if (!ownershipResult.isValid) {
      return ownershipResult;
    }

    const workspaceResult = this.validateWorkspaceAccess(user.workspaceId, dealWorkspaceId);
    if (!workspaceResult.isValid) {
      return workspaceResult;
    }

    return { isValid: true };
  }

  static canManageUsers(user: DomainUser): RuleResult {
    const requiredPermission = Permission.MANAGE_USERS;
    
    if (!this.hasPermission(user, requiredPermission)) {
      return {
        isValid: false,
        error: 'User does not have permission to manage users',
        code: 'USER_MANAGE_DENIED'
      };
    }

    return { isValid: true };
  }

  // Multi-tenancy enforcement
  static enforceTenantIsolation(user: DomainUser, resourceWorkspaceId: string): RuleResult {
    return this.validateTenantIsolation(user, resourceWorkspaceId);
  }

  // Team-level permissions
  static canAccessTeamResources(user: DomainUser, teamWorkspaceId: string): RuleResult {
    return this.validateWorkspaceAccess(user.workspaceId, teamWorkspaceId);
  }

  // Initialize user with role-based permissions
  static initializeUserPermissions(user: DomainUser): DomainUser {
    const rolePermissions = this.rolePermissions[user.role] || [];
    return {
      ...user,
      permissions: rolePermissions
    };
  }

  // Permission escalation check - using new permission system
  static validatePermissionEscalation(user: DomainUser, targetRole: RoleType): RuleResult {
    // Only users with users.manage permission can change roles
    if (!this.hasPermission(user, Permission.MANAGE_USERS)) {
      return {
        isValid: false,
        error: 'Only users with user management permission can change roles',
        code: 'ROLE_ESCALATION_DENIED'
      };
    }

    // Cannot escalate to higher role than self based on permissions
    const roleHierarchy: Record<RoleType, number> = {
      [Roles.USER]: 0,
      [Roles.EMPLOYEE]: 0,
      [Roles.INSTRUCTOR]: 1,
      [Roles.SALES]: 1,
      [Roles.MARKETING]: 1,
      [Roles.FINANCE]: 2,
      [Roles.HR]: 2,
      [Roles.MANAGER]: 2,
      [Roles.ADMIN]: 3,
      [Roles.SUPER_ADMIN]: 4
    };

    if (roleHierarchy[targetRole] > roleHierarchy[user.role]) {
      return {
        isValid: false,
        error: 'Cannot escalate to higher role than current user',
        code: 'ROLE_ESCALATION_DENIED'
      };
    }

    return { isValid: true };
  }

  // Private helpers
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
