import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logSecurityEvent } from '@/lib/server/security-audit';
import { Prisma } from '@prisma/client';
import { Roles, RoleType } from '@/constants/roles';

type RestoreErrorDetail = { entity: string; id: string; error: string };

/** Row from `(prisma as any).backup.findUnique` until Backup model is on the client. */
type BackupRecord = {
  id: string;
  filePath: string;
  metadata: Record<string, unknown> & { checksum?: string };
  type?: string;
  size?: number;
  createdAt?: Date;
  user?: { id: string; name: string; email: string } | null;
};

/** Row from `(prisma as any).restoreSession.create` / update. */
type RestoreSessionRecord = {
  id: string;
  backupId?: string;
  status?: string;
  initiatedBy?: string;
  options?: unknown;
  startedAt?: Date;
};

/**
 * Data Restore API
 * Restores CRM data from backup files
 * Supports full restore and selective restore options
 */

export async function POST(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        
        if (user.role !== Roles.ADMIN) {
          return createCompressedResponse({
            success: false,
            error: 'Access denied - Admin privileges required'
          }, 403);
        }
        
        const body = await request.json();
        const { 
          backupId, 
          restoreOptions = {},
          confirm = false 
        } = body;
        
        if (!backupId) {
          return createCompressedResponse({
            success: false,
            error: 'Backup ID is required'
          }, 400);
        }
        
        if (!confirm) {
          return createCompressedResponse({
            success: false,
            error: 'Restore must be confirmed. Set confirm=true to proceed.'
          }, 400);
        }
        
        // Get backup record
        const backup = (await withTimeout(
          (prisma as any).backup.findUnique({
            where: { id: backupId },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          5000
        )) as BackupRecord | null;
        
        if (!backup) {
          return createCompressedResponse({
            success: false,
            error: 'Backup not found'
          }, 404);
        }
        
        // Read backup file
        const backupData = await readBackupFile(backup.filePath);
        
        // Validate backup integrity
        const isValid = validateBackupIntegrity(backupData, backup.metadata);
        if (!isValid) {
          return createCompressedResponse({
            success: false,
            error: 'Backup file integrity check failed'
          }, 400);
        }
        
        // Create restore session
        const restoreSession = (await withTimeout(
          (prisma as any).restoreSession.create({
            data: {
              backupId,
              initiatedBy: user.id,
              status: 'in_progress',
              options: restoreOptions,
              startedAt: new Date()
            }
          }),
          5000
        )) as RestoreSessionRecord;
        
        // Perform restore based on options
        const restoreResult = await performRestore(backupData.data, restoreOptions, restoreSession.id);
        
        // Update restore session
        await withTimeout(
          (prisma as any).restoreSession.update({
            where: { id: restoreSession.id },
            data: {
              status: restoreResult.success ? 'completed' : 'failed',
              completedAt: new Date(),
              results: restoreResult
            }
          }),
          5000
        );
        
        await withTimeout(
          logSecurityEvent(request, {
            userId: user.id,
            email: user.email,
            action: 'BACKUP_RESTORED',
            meta: {
              backupId,
              restoreSessionId: restoreSession.id,
              options: restoreOptions,
              success: restoreResult.success
            }
          }),
          5000
        );
        
        if (restoreResult.success) {
          return createCompressedResponse({
            success: true,
            data: {
              restoreSession,
              results: restoreResult,
              message: 'Data restored successfully'
            }
          });
        } else {
          return createCompressedResponse({
            success: false,
            error: restoreResult.error || 'Restore failed',
            details: restoreResult
          }, 500);
        }
        
      } catch (error) {
        console.error('Backup restore error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to restore backup'
        }, 500);
      }
    }), { endpoint: 'backup-restore' }
  )(request);
}

export async function GET(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        
        if (user.role !== Roles.ADMIN) {
          return createCompressedResponse({
            success: false,
            error: 'Access denied - Admin privileges required'
          }, 403);
        }
        
        const { searchParams } = new URL(request.url);
        const backupId = searchParams.get('backupId');
        
        if (!backupId) {
          return createCompressedResponse({
            success: false,
            error: 'Backup ID is required'
          }, 400);
        }
        
        // Get backup preview
        const backup = (await withTimeout(
          (prisma as any).backup.findUnique({
            where: { id: backupId },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          5000
        )) as BackupRecord | null;
        
        if (!backup) {
          return createCompressedResponse({
            success: false,
            error: 'Backup not found'
          }, 404);
        }
        
        // Read backup file for preview
        const backupData = await readBackupFile(backup.filePath);
        
        // Generate preview statistics
        const preview = {
          backup: {
            id: backup.id,
            type: backup.type,
            timestamp: backup.createdAt,
            size: backup.size,
            createdBy: backup.user
          },
          contents: {
            users: backupData.data.users?.length || 0,
            leads: backupData.data.leads?.length || 0,
            deals: backupData.data.deals?.length || 0,
            activities: backupData.data.activities?.length || 0,
            notifications: backupData.data.notifications?.length || 0,
            auditLogs: backupData.data.auditLogs?.length || 0
          },
          metadata: backupData.metadata,
          integrity: validateBackupIntegrity(backupData, backup.metadata)
        };
        
        return createCompressedResponse({
          success: true,
          data: preview
        });
        
      } catch (error) {
        console.error('Backup preview error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to preview backup'
        }, 500);
      }
    }), { endpoint: 'backup-preview' }
  )(request);
}

// Helper functions
async function readBackupFile(filePath: string): Promise<any> {
  try {
    const fileContent = await readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Failed to read backup file');
  }
}

function validateBackupIntegrity(backupData: any, metadata: any): boolean {
  try {
    // Check if checksum matches
    const calculatedChecksum = generateChecksum(JSON.stringify(backupData.data));
    return calculatedChecksum === metadata.checksum;
  } catch (error) {
    return false;
  }
}

async function performRestore(data: any, options: any, sessionId: string): Promise<any> {
  const results: {
    success: boolean;
    restored: Record<string, unknown>;
    errors: RestoreErrorDetail[];
    warnings: string[];
  } = {
    success: true,
    restored: {},
    errors: [],
    warnings: []
  };
  
  try {
    // Restore users if included
    if (options.users !== false && data.users) {
      const userResult = await restoreUsers(data.users, options.overwriteExisting);
      results.restored.users = userResult;
      if (userResult.errors > 0) {
        results.errors.push(...userResult.errorDetails);
      }
    }
    
    // Restore leads if included
    if (options.leads !== false && data.leads) {
      const leadResult = await restoreLeads(data.leads, options.overwriteExisting);
      results.restored.leads = leadResult;
      if (leadResult.errors > 0) {
        results.errors.push(...leadResult.errorDetails);
      }
    }
    
    // Restore deals if included
    if (options.deals !== false && data.deals) {
      const dealResult = await restoreDeals(data.deals, options.overwriteExisting);
      results.restored.deals = dealResult;
      if (dealResult.errors > 0) {
        results.errors.push(...dealResult.errorDetails);
      }
    }
    
    // Restore activities if included
    if (options.activities !== false && data.activities) {
      const activityResult = await restoreActivities(data.activities, options.overwriteExisting);
      results.restored.activities = activityResult;
      if (activityResult.errors > 0) {
        results.errors.push(...activityResult.errorDetails);
      }
    }
    
    // Restore notifications if included
    if (options.notifications !== false && data.notifications) {
      const notificationResult = await restoreNotifications(data.notifications, options.overwriteExisting);
      results.restored.notifications = notificationResult;
      if (notificationResult.errors > 0) {
        results.errors.push(...notificationResult.errorDetails);
      }
    }
    
    // Restore audit logs if included (usually not recommended)
    if (options.auditLogs === true && data.auditLogs) {
      const auditResult = await restoreAuditLogs(data.auditLogs);
      results.restored.auditLogs = auditResult;
      if (auditResult.errors > 0) {
        results.errors.push(...auditResult.errorDetails);
      }
    }
    
    return results;
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Restore failed',
      restored: results.restored,
      errors: results.errors
    };
  }
}

async function restoreUsers(users: any[], overwrite: boolean): Promise<any> {
  const result = {
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [] as RestoreErrorDetail[]
  };
  
  for (const user of users) {
    try {
      const existingUser = (await withTimeout(
        (prisma as any).user.findUnique({
          where: { email: user.email }
        }),
        3000
      )) as { id: string } | null;
      
      if (existingUser && overwrite) {
        await withTimeout(
          (prisma as any).user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name,
              role: user.role,
              organization: user.organization,
              isActive: user.isActive,
              updatedAt: new Date()
            }
          }),
          3000
        );
        result.updated++;
      } else if (!existingUser) {
        await withTimeout(
          (prisma as any).user.create({
            data: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              organization: user.organization,
              isActive: user.isActive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }
          }),
          3000
        );
        result.created++;
      }
      
    } catch (error) {
      result.errors++;
      result.errorDetails.push({
        entity: 'user',
        id: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return result;
}

async function restoreLeads(leads: any[], overwrite: boolean): Promise<any> {
  const result = {
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [] as RestoreErrorDetail[]
  };
  
  for (const lead of leads) {
    try {
      const existingLead = await withTimeout(
        (prisma as any).lead.findUnique({
          where: { id: lead.id }
        }),
        3000
      );
      
      if (existingLead && overwrite) {
        await withTimeout(
          (prisma as any).lead.update({
            where: { id: lead.id },
            data: {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              status: lead.status,
              notes: lead.notes,
              updatedAt: new Date()
            }
          }),
          3000
        );
        result.updated++;
      } else if (!existingLead) {
        await withTimeout(
          (prisma as any).lead.create({
            data: {
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              status: lead.status,
              notes: lead.notes,
              userId: lead.owner?.id,
              createdAt: lead.createdAt,
              updatedAt: lead.updatedAt
            }
          }),
          3000
        );
        result.created++;
      }
      
    } catch (error) {
      result.errors++;
      result.errorDetails.push({
        entity: 'lead',
        id: lead.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return result;
}

async function restoreDeals(deals: any[], overwrite: boolean): Promise<any> {
  const result = {
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [] as RestoreErrorDetail[]
  };
  
  for (const deal of deals) {
    try {
      const existingDeal = await withTimeout(
        (prisma as any).deal.findUnique({
          where: { id: deal.id }
        }),
        3000
      );
      
      if (existingDeal && overwrite) {
        await withTimeout(
          (prisma as any).deal.update({
            where: { id: deal.id },
            data: {
              name: deal.name,
              description: deal.description,
              value: deal.value,
              stage: deal.stage,
              leadId: deal.lead?.id,
              userId: deal.user?.id,
              updatedAt: new Date()
            }
          }),
          3000
        );
        result.updated++;
      } else if (!existingDeal) {
        await withTimeout(
          (prisma as any).deal.create({
            data: {
              id: deal.id,
              name: deal.name,
              description: deal.description,
              value: deal.value,
              stage: deal.stage,
              leadId: deal.lead?.id,
              userId: deal.user?.id,
              createdAt: deal.createdAt,
              updatedAt: deal.updatedAt
            }
          }),
          3000
        );
        result.created++;
      }
      
    } catch (error) {
      result.errors++;
      result.errorDetails.push({
        entity: 'deal',
        id: deal.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return result;
}

async function restoreActivities(activities: any[], overwrite: boolean): Promise<any> {
  const result = {
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [] as RestoreErrorDetail[]
  };
  
  for (const activity of activities) {
    try {
      const existingActivity = await withTimeout(
        (prisma as any).activity.findUnique({
          where: { id: activity.id }
        }),
        3000
      );
      
      if (!existingActivity) {
        await withTimeout(
          (prisma as any).activity.create({
            data: {
              id: activity.id,
              type: activity.type,
              notes: activity.notes,
              outcome: activity.outcome,
              userId: activity.user?.id,
              leadId: activity.lead?.id,
              dealId: activity.deal?.id,
              createdAt: activity.createdAt
            }
          }),
          3000
        );
        result.created++;
      }
      
    } catch (error) {
      result.errors++;
      result.errorDetails.push({
        entity: 'activity',
        id: activity.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return result;
}

async function restoreNotifications(notifications: any[], overwrite: boolean): Promise<any> {
  const result = {
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [] as RestoreErrorDetail[]
  };
  
  for (const notification of notifications) {
    try {
      const existingNotification = await withTimeout(
        (prisma as any).notification.findUnique({
          where: { id: notification.id }
        }),
        3000
      );
      
      if (!existingNotification) {
        await withTimeout(
          (prisma as any).notification.create({
            data: {
              id: notification.id,
              userId: notification.user?.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              isRead: notification.isRead,
              createdAt: notification.createdAt
            }
          }),
          3000
        );
        result.created++;
      }
      
    } catch (error) {
      result.errors++;
      result.errorDetails.push({
        entity: 'notification',
        id: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return result;
}

async function restoreAuditLogs(auditLogs: any[]): Promise<any> {
  const result = { created: 0, errors: 0, errorDetails: [] as RestoreErrorDetail[] };
  
  for (const entry of auditLogs) {
    try {
      const userId = entry.userId ?? entry.user?.id ?? null;
      await withTimeout(
        prisma.securityLog.create({
          data: {
            ...(entry.id ? { id: entry.id } : {}),
            userId,
            action: entry.action,
            meta: (entry.details ?? {}) as Prisma.InputJsonValue,
            ...(entry.createdAt ? { createdAt: new Date(entry.createdAt) } : {})
          }
        }),
        3000
      );
      result.created++;
      
    } catch (error) {
      result.errors++;
      result.errorDetails.push({
        entity: 'securityLog',
        id: entry.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return result;
}

function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
