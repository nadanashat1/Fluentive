import { prisma } from '@/lib/prisma';
import { ActivityType } from '@prisma/client';
import { encodeActivityDescription } from '@/lib/activity-logs/normalize';
import type { ActivityEventCategory, ActivitySeverity } from '@/lib/activity-logs/types';

/**
 * ENTERPRISE AUDIT SYSTEM
 * Records all critical system actions for security and compliance.
 * Uses the canonical Activity model for centralized event tracking.
 */
export class AuditService {
  public static async log(data: {
    userId: string;
    organizationId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // We map the audit log to the centralized Activity model
    const detailText = data.details
      ? typeof data.details === 'string'
        ? data.details
        : JSON.stringify(data.details)
      : '';
    const category = (data.entityType?.toUpperCase() || 'SYSTEM') as ActivityEventCategory;
    const severity: ActivitySeverity = /fail|denied|error/i.test(`${data.action} ${detailText}`)
      ? 'warning'
      : 'info';

    return await prisma.activity.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        type: ActivityType.SYSTEM,
        description: encodeActivityDescription(
          `[${data.entityType || 'SYSTEM'}] ${data.action}: ${detailText}`,
          {
            category,
            severity,
            entityType: data.entityType,
            entityId: data.entityId,
            organizationId: data.organizationId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
          }
        ),
        // Cross-linking based on entityType
        ...(data.entityType === 'LEAD' && data.entityId ? { leadId: data.entityId } : {}),
        ...(data.entityType === 'DEAL' && data.entityId ? { dealId: data.entityId } : {}),
      }
    });
  }
}
