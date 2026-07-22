// 🛡️ Enterprise Audit Logging System
// Logs all sensitive and admin actions for security compliance

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export interface AuditEvent {
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  // Core audit logging function
  static async log(event: AuditEvent): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          userId: event.userId,
          email: event.userEmail,
          action: `${event.action}:${event.resource}`, // Combine action and resource
          key: event.resourceId,
          meta: {
            resource: event.resource,
            resourceId: event.resourceId,
            success: event.success,
            errorMessage: event.errorMessage,
            ...event.details
          },
          ip: event.ip,
          userAgent: event.userAgent,
        }
      });

      // Also log to console for immediate visibility
      console.log(`[AUDIT] ${event.action} on ${event.resource} by ${event.userEmail}`, {
        userId: event.userId,
        success: event.success,
        ip: event.ip
      });
    } catch (error) {
      console.error('[AUDIT] Failed to log audit event:', error);
      // Don't throw - audit logging failure shouldn't break the main flow
    }
  }

  // Helper to extract request context
  static getRequestContext(request?: NextRequest): { ip: string; userAgent: string } {
    const ip = request?.headers.get('x-forwarded-for') || 
                request?.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request?.headers.get('user-agent') || 'unknown';
    
    return { ip, userAgent };
  }

  // Specific audit methods for common actions
  static async logUserAction(
    user: { id: string; email: string },
    action: string,
    targetUserId?: string,
    request?: NextRequest,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const { ip, userAgent } = this.getRequestContext(request);
    
    await this.log({
      userId: user.id,
      userEmail: user.email,
      action,
      resource: 'user',
      resourceId: targetUserId,
      details: { targetUserId },
      ip,
      userAgent,
      success,
      errorMessage
    });
  }

  static async logOrganizationAction(
    user: { id: string; email: string },
    action: string,
    orgId?: string,
    request?: NextRequest,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const { ip, userAgent } = this.getRequestContext(request);
    
    await this.log({
      userId: user.id,
      userEmail: user.email,
      action,
      resource: 'organization',
      resourceId: orgId,
      details: { orgId },
      ip,
      userAgent,
      success,
      errorMessage
    });
  }

  static async logSystemAction(
    user: { id: string; email: string },
    action: string,
    details?: Record<string, any>,
    request?: NextRequest,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const { ip, userAgent } = this.getRequestContext(request);
    
    await this.log({
      userId: user.id,
      userEmail: user.email,
      action,
      resource: 'system',
      details,
      ip,
      userAgent,
      success,
      errorMessage
    });
  }

  static async logSecurityEvent(
    user: { id: string; email: string },
    action: string,
    details?: Record<string, any>,
    request?: NextRequest,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const { ip, userAgent } = this.getRequestContext(request);
    
    await this.log({
      userId: user.id,
      userEmail: user.email,
      action,
      resource: 'security',
      details,
      ip,
      userAgent,
      success,
      errorMessage
    });
  }

  // Middleware for automatic audit logging
  static createAuditMiddleware(
    action: string,
    resource: string,
    getResourceId?: (req: NextRequest, params?: any) => string | undefined
  ) {
    return async (request: NextRequest, context?: any) => {
      // This would be called after successful authentication
      // Implementation depends on Next.js middleware pattern
      return null;
    };
  }
}

// Predefined audit actions
export const AUDIT_ACTIONS = {
  // User management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_UNLOCKED: 'USER_UNLOCKED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  
  // Organization
  ORG_CREATED: 'ORG_CREATED',
  ORG_UPDATED: 'ORG_UPDATED',
  INVITATION_SENT: 'INVITATION_SENT',
  INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
  
  // Security
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  SECURITY_BREACH_ATTEMPT: 'SECURITY_BREACH_ATTEMPT',
  
  // System
  DATA_EXPORTED: 'DATA_EXPORTED',
  CONFIG_CHANGED: 'CONFIG_CHANGED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_RESTORED: 'BACKUP_RESTORED',
} as const;

// Helper function to wrap API handlers with audit logging
export function withAuditLogging<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<R>,
  auditConfig: {
    action: string;
    resource: string;
    getResourceId?: (request: NextRequest, ...args: T) => string | undefined;
    getDetails?: (request: NextRequest, ...args: T) => Record<string, any>;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;

    try {
      const result = await handler(request, ...args);
      return result;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      // Log the audit event after the handler completes
      // Note: This would need user context from the request
      // Implementation would depend on how user is extracted in the actual handler
      const duration = Date.now() - startTime;
      
      console.log(`[AUDIT] ${auditConfig.action} on ${auditConfig.resource}`, {
        duration: `${duration}ms`,
        success,
        errorMessage
      });
    }
  };
}
