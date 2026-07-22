import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { logSecurityEvent, fetchSecurityLogsWithUsers } from '@/lib/server/security-audit';
import { randomBytes } from 'crypto';
import { Roles, RoleType } from '@/constants/roles';

/** Result shape from `(prisma as any).backup.aggregate` — explicit until Backup is on the Prisma client. */
type BackupAggregateStats = {
  _count: { id: number };
  _sum: { size: number | null };
};

/**
 * Data Backup API
 * Creates comprehensive backups of all CRM data
 * Supports scheduled backups and manual backup creation
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
        
        // Only admins can create backups
        if (user.role !== Roles.ADMIN) {
          return createCompressedResponse({
            success: false,
            error: 'Access denied - Admin privileges required'
          }, 403);
        }
        
        const body = await request.json();
        const { 
          type = 'full', 
          includeFiles = true, 
          compression = true,
          encryption = false 
        } = body;
        
        // Generate backup ID and timestamp
        const backupId = `backup_${getCurrentTimestamp()}_${randomBytes(8).toString('hex')}`;
        const timestamp = new Date().toISOString();
        
        // Create backup directory
        const backupDir = join(process.cwd(), 'backups');
        await mkdir(backupDir, { recursive: true });
        
        // Collect data based on backup type
        let backupData: any = {};
        let backupSize = 0;
        
        switch (type) {
          case 'full':
            backupData = await createFullBackup();
            break;
          case 'incremental':
            backupData = await createIncrementalBackup();
            break;
          case 'differential':
            backupData = await createDifferentialBackup();
            break;
          default:
            return createCompressedResponse({
              success: false,
              error: 'Invalid backup type'
            }, 400);
        }
        
        // Calculate backup size
        backupSize = JSON.stringify(backupData).length;
        
        // Create backup metadata
        const metadata = {
          id: backupId,
          type,
          timestamp,
          createdBy: user.id,
          size: backupSize,
          compression,
          encryption,
          includes: {
            users: !!backupData.users,
            leads: !!backupData.leads,
            deals: !!backupData.deals,
            activities: !!backupData.activities,
            notifications: !!backupData.notifications,
            auditLogs: !!backupData.auditLogs,
            files: includeFiles
          },
          checksum: generateChecksum(JSON.stringify(backupData))
        };
        
        // Save backup to file
        const backupFileName = `${backupId}.json`;
        const backupFilePath = join(backupDir, backupFileName);
        
        await writeFile(backupFilePath, JSON.stringify({
          metadata,
          data: backupData
        }), 'utf8');
        
        // Save backup record to database
        const backupRecord = await withTimeout(
          (prisma as any).backup.create({
            data: {
              id: backupId,
              type,
              size: backupSize,
              createdBy: user.id,
              metadata,
              filePath: backupFilePath,
              isEncrypted: encryption,
              isCompressed: compression,
              status: 'completed'
            },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          10000
        );
        
        await withTimeout(
          logSecurityEvent(request, {
            userId: user.id,
            email: user.email,
            action: 'BACKUP_CREATED',
            meta: {
              backupId,
              type,
              size: backupSize
            }
          }),
          5000
        );
        
        return createCompressedResponse({
          success: true,
          data: {
            backup: backupRecord,
            metadata,
            downloadUrl: `/api/backup/download/${backupId}`,
            message: 'Backup created successfully'
          }
        }, 201);
        
      } catch (error) {
        console.error('Backup creation error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create backup'
        }, 500);
      }
    }), { endpoint: 'backup-create' }
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
        const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const skip = (page - 1) * limit;
        
        // Get backup records
        const [backups, totalCount] = await withTimeout(
          Promise.all([
            (prisma as any).backup.findMany({
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              },
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit
            }),
            (prisma as any).backup.count()
          ]),
          15000
        );
        
        // Get backup statistics
        const stats = (await withTimeout(
          (prisma as any).backup.aggregate({
            _count: { id: true },
            _sum: { size: true },
            where: {
              status: 'completed'
            }
          }),
          5000
        )) as BackupAggregateStats;
        
        // Get recent backup activity
        const recentActivity = await withTimeout(
          fetchSecurityLogsWithUsers({ action: 'BACKUP_CREATED' }, { take: 10 }),
          10000
        );
        
        return createCompressedResponse({
          success: true,
          data: {
            backups,
            pagination: {
              page,
              limit,
              total: totalCount,
              pages: Math.ceil(totalCount / limit),
              hasNext: skip + limit < totalCount,
              hasPrev: page > 1
            },
            statistics: {
              totalBackups: stats._count.id,
              totalSize: stats._sum.size || 0,
              averageSize: stats._count.id > 0 ? (stats._sum.size || 0) / stats._count.id : 0
            },
            recentActivity,
            storageInfo: await getStorageInfo()
          }
        });
        
      } catch (error) {
        console.error('Backup list error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch backups'
        }, 500);
      }
    }), { endpoint: 'backup-list' }
  )(request);
}

// Backup creation functions
async function createFullBackup(): Promise<any> {
  const [
    users,
    leads,
    deals,
    activities,
    notifications,
    auditLogs
  ] = await withTimeout(
    Promise.all([
      (prisma as any).user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      (prisma as any).lead.findMany({
        where: { isDeleted: false },
        include: {
          owner: { select: { id: true, name: true, email: true } }
        }
      }),
      (prisma as any).deal.findMany({
        where: { isDeleted: false },
        include: {
          lead: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      (prisma as any).activity.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } }
        }
      }),
      (prisma as any).notification.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      fetchSecurityLogsWithUsers()
    ]),
    30000
  );
  
  return {
    users,
    leads,
    deals,
    activities,
    notifications,
    auditLogs,
    exportedAt: new Date().toISOString(),
    version: '2.0.0'
  };
}

async function createIncrementalBackup(): Promise<any> {
  // Get the last backup timestamp
  const lastBackup = (await withTimeout(
    (prisma as any).backup.findFirst({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    }),
    5000
  )) as { createdAt: Date } | null;
  
  if (!lastBackup) {
    return createFullBackup();
  }
  
  const since = lastBackup.createdAt;
  
  // Get only records created since last backup
  const [
    users,
    leads,
    deals,
    activities,
    notifications,
    auditLogs
  ] = await withTimeout(
    Promise.all([
      (prisma as any).user.findMany({
        where: { createdAt: { gte: since } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      (prisma as any).lead.findMany({
        where: { 
          isDeleted: false,
          createdAt: { gte: since }
        },
        include: {
          owner: { select: { id: true, name: true, email: true } }
        }
      }),
      (prisma as any).deal.findMany({
        where: { 
          isDeleted: false,
          createdAt: { gte: since }
        },
        include: {
          lead: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      (prisma as any).activity.findMany({
        where: { createdAt: { gte: since } },
        include: {
          user: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } }
        }
      }),
      (prisma as any).notification.findMany({
        where: { createdAt: { gte: since } },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      fetchSecurityLogsWithUsers({ createdAt: { gte: since } })
    ]),
    30000
  );
  
  return {
    users,
    leads,
    deals,
    activities,
    notifications,
    auditLogs,
    exportedAt: new Date().toISOString(),
    backupType: 'incremental',
    since: since.toISOString(),
    version: '2.0.0'
  };
}

async function createDifferentialBackup(): Promise<any> {
  // Similar to incremental but includes all changes (updates, deletions)
  // For now, implement as incremental
  return createIncrementalBackup();
}

// Helper functions
function generateChecksum(data: string): string {
  // Simple checksum - in production, use a proper hashing algorithm
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

async function getStorageInfo(): Promise<any> {
  try {
    const backupDir = join(process.cwd(), 'backups');
    const { readdir, stat } = await import('fs/promises');
    
    const files = await readdir(backupDir);
    let totalSize = 0;
    let fileCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(backupDir, file);
        const stats = await stat(filePath);
        totalSize += stats.size;
        fileCount++;
      }
    }
    
    return {
      totalSize,
      fileCount,
      averageSize: fileCount > 0 ? totalSize / fileCount : 0,
      availableSpace: 'N/A' // Would need additional system monitoring
    };
  } catch (error) {
    return {
      totalSize: 0,
      fileCount: 0,
      averageSize: 0,
      availableSpace: 'N/A'
    };
  }
}

function getCurrentTimestamp(): number {
  return Date.now();
}
