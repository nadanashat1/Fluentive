import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logSecurityEvent } from '@/lib/server/security-audit';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { Roles, RoleType } from '@/constants/roles';

/**
 * Security Audit Logs API
 * Provides comprehensive audit trail for security events
 * Implements filtering, pagination, and export capabilities
 */

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
        
        // Only admins can access audit logs
        if (user.role !== Roles.ADMIN) {
          return createCompressedResponse({
            success: false,
            error: 'Access denied - Admin privileges required'
          }, 403);
        }
        
        const { searchParams } = new URL(request.url);
        
        // Parse query parameters
        const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const skip = (page - 1) * limit;
        
        const action = searchParams.get('action');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const severity = searchParams.get('severity');
        
        const where: Prisma.SecurityLogWhereInput = {};
        
        if (action) {
          where.action = { contains: action, mode: 'insensitive' };
        }
        
        if (userId) {
          where.userId = userId;
        }
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }
        
        if (severity) {
          where.meta = { path: ['severity'], equals: severity };
        }
        
        const [rows, totalCount] = await withTimeout(
          Promise.all([
            prisma.securityLog.findMany({
              where,
              select: {
                id: true,
                action: true,
                meta: true,
                createdAt: true,
                userId: true
              },
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit
            }),
            prisma.securityLog.count({ where })
          ]),
          8000
        );
        
        const auditLogs = rows.map((r) => {
          const meta = (r.meta && typeof r.meta === 'object' ? r.meta : {}) as Record<string, unknown>;
          return {
            id: r.id,
            action: r.action,
            severity: typeof meta.severity === 'string' ? meta.severity : 'info',
            createdAt: r.createdAt,
            userId: r.userId
          };
        });
        
        const stats = await withTimeout(
          prisma.securityLog.groupBy({
            by: ['action'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10
          }),
          10000
        );
        
        const recentRows = await withTimeout(
          prisma.securityLog.findMany({
            where: {
              action: {
                in: ['LOGIN_FAILED', '2FA_ENABLED', '2FA_DISABLED', 'PASSWORD_CHANGED', 'ACCOUNT_LOCKED']
              }
            },
            select: {
              id: true,
              userId: true,
              action: true,
              meta: true,
              createdAt: true,
              email: true,
              ip: true,
              userAgent: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }),
          10000
        );
        
        const recentUserIds = [...new Set(recentRows.map((r) => r.userId).filter((x): x is string => !!x))];
        const recentUsers =
          recentUserIds.length === 0
            ? []
            : await prisma.user.findMany({
                where: { id: { in: recentUserIds } },
                select: { id: true, name: true, email: true }
              });
        const recentUserMap = Object.fromEntries(recentUsers.map((u) => [u.id, u]));
        const recentSecurityEvents = recentRows.map((r) => {
          const meta = (r.meta && typeof r.meta === 'object' ? r.meta : {}) as Record<string, unknown>;
          return {
            id: r.id,
            action: r.action,
            createdAt: r.createdAt,
            userId: r.userId,
            email: r.email,
            ip: r.ip,
            userAgent: r.userAgent,
            details: meta,
            user: r.userId ? recentUserMap[r.userId] ?? null : null
          };
        });
        
        return createCompressedResponse({
          success: true,
          data: {
            auditLogs,
            pagination: {
              page,
              limit,
              total: totalCount,
              pages: Math.ceil(totalCount / limit),
              hasNext: skip + limit < totalCount,
              hasPrev: page > 1
            },
            statistics: (stats as any[]).map((stat: any) => ({
              action: stat.action,
              count: stat._count.id
            })),
            recentSecurityEvents,
            summary: {
              totalEvents: totalCount,
              criticalEvents: auditLogs.filter((log: any) => 
                ['LOGIN_FAILED', 'ACCOUNT_LOCKED', '2FA_DISABLED'].includes(log.action)
              ).length,
              timeRange: {
                start: startDate || 'all time',
                end: endDate || 'now'
              }
            }
          }
        });
        
      } catch (error) {
        console.error('Audit logs error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch audit logs'
        }, 500);
      }
    }), { endpoint: 'audit-logs' }
  )(request);
}

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
        const body = await request.json();
        
        const { action, details, severity = 'info' } = body;
        
        if (!action) {
          return createCompressedResponse({
            success: false,
            error: 'Action is required'
          }, 400);
        }
        
        const auditLog = await withTimeout(
          logSecurityEvent(request, {
            userId: user.id,
            email: user.email,
            action,
            meta: {
              ...(details && typeof details === 'object' ? details : {}),
              severity,
              timestamp: new Date().toISOString()
            }
          }),
          10000
        );
        
        return createCompressedResponse({
          success: true,
          data: {
            ...auditLog,
            user: { id: user.id, name: user.name, email: user.email },
            details: auditLog.meta,
            severity
          },
          message: 'Audit log entry created successfully'
        }, 201);
        
      } catch (error) {
        console.error('Create audit log error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create audit log'
        }, 500);
      }
    }), { endpoint: 'audit-logs' }
  )(request);
}

export async function DELETE(request: NextRequest) {
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
        
        // Only admins can delete audit logs
        if (user.role !== Roles.ADMIN) {
          return createCompressedResponse({
            success: false,
            error: 'Access denied - Admin privileges required'
          }, 403);
        }
        
        const { searchParams } = new URL(request.url);
        const olderThan = searchParams.get('olderThan');
        const action = searchParams.get('action');
        
        if (!olderThan && !action) {
          return createCompressedResponse({
            success: false,
            error: 'Either olderThan date or action filter is required'
          }, 400);
        }
        
        // Build where clause for deletion
        const where: Prisma.SecurityLogWhereInput = {};
        
        if (olderThan) {
          where.createdAt = {
            lt: new Date(olderThan)
          };
        }
        
        if (action) {
          where.action = action;
        }
        
        const result = await withTimeout(
          prisma.securityLog.deleteMany({
            where
          }),
          10000
        );
        
        await withTimeout(
          logSecurityEvent(request, {
            userId: user.id,
            email: user.email,
            action: 'AUDIT_LOGS_DELETED',
            meta: {
              deletedCount: result.count,
              criteria: { olderThan, action },
              severity: 'warning'
            }
          }),
          5000
        );
        
        return createCompressedResponse({
          success: true,
          data: {
            deletedCount: result.count,
            message: `${result.count} audit log entries deleted`
          }
        });
        
      } catch (error) {
        console.error('Delete audit logs error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete audit logs'
        }, 500);
      }
    }), { endpoint: 'audit-logs' }
  )(request);
}
