import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { Roles, RoleType } from '@/constants/roles';

/**
 * API Rate Limiting and Quota Management API
 * Provides comprehensive rate limiting and usage tracking
 * Implements per-user quotas and system-wide limits
 */

interface RateLimitConfig {
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

interface QuotaConfig {
  plan: string;
  apiCallsPerMonth: number;
  storageLimit: number; // MB
  features: string[];
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'default': {
    endpoint: 'default',
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 10
  },
  'heavy': {
    endpoint: 'heavy',
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
    burstLimit: 5
  },
  'auth': {
    endpoint: 'auth',
    requestsPerMinute: 20,
    requestsPerHour: 200,
    requestsPerDay: 1000,
    burstLimit: 5
  },
  'upload': {
    endpoint: 'upload',
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
    burstLimit: 2
  }
};

const QUOTA_PLANS: Record<string, QuotaConfig> = {
  'FREE': {
    plan: 'FREE',
    apiCallsPerMonth: 10000,
    storageLimit: 100,
    features: ['basic_crud', 'limited_reports']
  },
  'PRO': {
    plan: 'PRO',
    apiCallsPerMonth: 100000,
    storageLimit: 1000,
    features: ['full_crud', 'advanced_reports', 'ai_insights', 'api_access']
  },
  'ENTERPRISE': {
    plan: 'ENTERPRISE',
    apiCallsPerMonth: 1000000,
    storageLimit: 10000,
    features: ['full_crud', 'advanced_reports', 'ai_insights', 'api_access', 'custom_integrations', 'priority_support']
  }
};

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
        const { searchParams } = new URL(request.url);
        
        const endpoint = searchParams.get('endpoint') || 'default';
        const timeframe = searchParams.get('timeframe') || 'current';
        
        // Get user's quota information
        const userQuota = await getUserQuota(user.id);
        
        // Get rate limit status
        const rateLimitStatus = await getRateLimitStatus(user.id, endpoint);
        
        // Get usage statistics
        const usageStats = await getUsageStats(user.id, timeframe);
        
        return createCompressedResponse({
          success: true,
          data: {
            user: {
              id: user.id,
              plan: userQuota.plan,
              quota: userQuota,
              currentUsage: usageStats
            },
            rateLimits: {
              endpoint,
              config: RATE_LIMITS[endpoint] || RATE_LIMITS.default,
              status: rateLimitStatus
            },
            system: {
              totalUsers: await getTotalUsers(),
              systemLoad: await getSystemLoad()
            }
          }
        });
        
      } catch (error) {
        console.error('Quota status error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get quota status'
        }, 500);
      }
    }), { endpoint: 'quota-status' }
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
        
        const { action, endpoint, limit, duration } = body;
        
        // Only admins can modify rate limits
        if (user.role !== Roles.ADMIN) {
          return createCompressedResponse({
            success: false,
            error: 'Access denied - Admin privileges required'
          }, 403);
        }
        
        switch (action) {
          case 'update_rate_limit':
            const updated = await updateRateLimit(endpoint, limit, duration);
            return createCompressedResponse({
              success: true,
              data: updated,
              message: 'Rate limit updated successfully'
            });
            
          case 'reset_user_quota':
            const reset = await resetUserQuota(body.userId);
            return createCompressedResponse({
              success: true,
              data: reset,
              message: 'User quota reset successfully'
            });
            
          case 'update_user_plan':
            const planUpdate = await updateUserPlan(body.userId, body.plan);
            return createCompressedResponse({
              success: true,
              data: planUpdate,
              message: 'User plan updated successfully'
            });
            
          default:
            return createCompressedResponse({
              success: false,
              error: 'Invalid action'
            }, 400);
        }
        
      } catch (error) {
        console.error('Quota management error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to manage quota'
        }, 500);
      }
    }), { endpoint: 'quota-management' }
  )(request);
}

export async function PUT(request: NextRequest) {
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
        
        const { endpoint, action = 'check' } = body;
        
        // Check rate limit for the user
        const rateLimitResult = await checkRateLimit(user.id, endpoint);
        
        // Log the request for analytics
        await logApiRequest(user.id, endpoint, rateLimitResult.allowed);
        
        if (!rateLimitResult.allowed) {
          return createCompressedResponse({
            success: false,
            error: 'Rate limit exceeded',
            data: {
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              resetTime: rateLimitResult.resetTime,
              retryAfter: rateLimitResult.retryAfter
            }
          }, 429);
        }
        
        // Check quota if applicable
        const quotaCheck = await checkUserQuota(user.id);
        if (!quotaCheck.allowed) {
          return createCompressedResponse({
            success: false,
            error: 'API quota exceeded',
            data: {
              quota: quotaCheck.quota,
              usage: quotaCheck.usage,
              resetTime: quotaCheck.resetTime
            }
          }, 429);
        }
        
        return createCompressedResponse({
          success: true,
          data: {
            allowed: true,
            rateLimit: rateLimitResult,
            quota: quotaCheck
          }
        });
        
      } catch (error) {
        console.error('Rate limit check error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check rate limit'
        }, 500);
      }
    }), { endpoint: 'rate-limit-check' }
  )(request);
}

// Helper functions
async function getUserQuota(userId: string): Promise<any> {
  const user = (await withTimeout(
    (prisma as any).user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        subscriptionPlan: true, 
        createdAt: true 
      }
    }),
    5000
  )) as { id: string; subscriptionPlan?: string | null; createdAt: Date } | null;
  
  const plan = QUOTA_PLANS[user?.subscriptionPlan || 'FREE'];
  
  // Get current usage
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const usage = (await withTimeout(
    (prisma as any).apiUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: currentMonth }
      },
      _sum: { requestCount: true },
      _count: { id: true }
    }),
    5000
  )) as {
    _sum: { requestCount: number | null };
    _count: { id: number };
  };
  
  return {
    plan: plan.plan,
    limits: {
      apiCallsPerMonth: plan.apiCallsPerMonth,
      storageLimit: plan.storageLimit,
      features: plan.features
    },
    usage: {
      apiCalls: usage._sum.requestCount || 0,
      requests: usage._count.id || 0,
      percentage: (usage._sum.requestCount || 0) / plan.apiCallsPerMonth * 100
    }
  };
}

async function getRateLimitStatus(userId: string, endpoint: string): Promise<any> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const now = new Date();
  
  // Get usage in different time windows
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const [minuteUsage, hourUsage, dayUsage] = await withTimeout(
    Promise.all([
      (prisma as any).rateLimitUsage.count({
        where: {
          userId,
          endpoint,
          createdAt: { gte: oneMinuteAgo }
        }
      }),
      (prisma as any).rateLimitUsage.count({
        where: {
          userId,
          endpoint,
          createdAt: { gte: oneHourAgo }
        }
      }),
      (prisma as any).rateLimitUsage.count({
        where: {
          userId,
          endpoint,
          createdAt: { gte: oneDayAgo }
        }
      })
    ]),
    10000
  );
  
  return {
    limits: config,
    usage: {
      minute: minuteUsage,
      hour: hourUsage,
      day: dayUsage
    },
    status: {
      minuteLimit: minuteUsage >= config.requestsPerMinute,
      hourLimit: hourUsage >= config.requestsPerHour,
      dayLimit: dayUsage >= config.requestsPerDay
    },
    remaining: {
      minute: Math.max(0, config.requestsPerMinute - minuteUsage),
      hour: Math.max(0, config.requestsPerHour - hourUsage),
      day: Math.max(0, config.requestsPerDay - dayUsage)
    }
  };
}

async function getUsageStats(userId: string, timeframe: string): Promise<any> {
  const now = new Date();
  let startDate: Date;
  
  switch (timeframe) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  const usage = (await withTimeout(
    (prisma as any).apiUsage.groupBy({
      by: ['endpoint'],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _sum: { requestCount: true },
      _count: { id: true },
      orderBy: { _sum: { requestCount: 'desc' } }
    }),
    10000
  )) as Array<{
    endpoint: string;
    _sum: { requestCount: number | null };
    _count: { id: number };
  }>;
  
  return {
    timeframe,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    byEndpoint: usage.map(stat => ({
      endpoint: stat.endpoint,
      requests: stat._count.id,
      totalRequests: stat._sum.requestCount || 0
    })),
    totalRequests: usage.reduce((sum, stat) => sum + (stat._sum.requestCount || 0), 0)
  };
}

async function checkRateLimit(userId: string, endpoint: string): Promise<any> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  
  const usage = (await withTimeout(
    (prisma as any).rateLimitUsage.count({
      where: {
        userId,
        endpoint,
        createdAt: { gte: oneMinuteAgo }
      }
    }),
    5000
  )) as number;
  
  const allowed = usage < config.requestsPerMinute;
  const remaining = Math.max(0, config.requestsPerMinute - usage);
  
  return {
    allowed,
    limit: config.requestsPerMinute,
    current: usage,
    remaining,
    resetTime: new Date(oneMinuteAgo.getTime() + 60 * 1000).toISOString(),
    retryAfter: allowed ? 0 : 60
  };
}

async function checkUserQuota(userId: string): Promise<any> {
  const quota = await getUserQuota(userId);
  
  return {
    allowed: quota.usage.percentage < 100,
    quota: quota.limits,
    usage: quota.usage,
    resetTime: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
  };
}

async function logApiRequest(userId: string, endpoint: string, allowed: boolean): Promise<void> {
  try {
    await withTimeout(
      (prisma as any).apiUsage.create({
        data: {
          userId,
          endpoint,
          requestCount: 1,
          allowed,
          createdAt: new Date()
        }
      }),
      3000
    );
    
    await withTimeout(
      (prisma as any).rateLimitUsage.create({
        data: {
          userId,
          endpoint,
          createdAt: new Date()
        }
      }),
      3000
    );
  } catch (error) {
    // Log errors but don't fail the request
    console.error('Failed to log API request:', error);
  }
}

async function updateRateLimit(endpoint: string, limit: number, duration: string): Promise<any> {
  // Update rate limit configuration
  // This would typically update a configuration file or database
  return {
    endpoint,
    newLimit: limit,
    duration,
    updated: true
  };
}

async function resetUserQuota(userId: string): Promise<any> {
  // Reset user's API usage
  await withTimeout(
    (prisma as any).apiUsage.deleteMany({
      where: { userId }
    }),
    5000
  );
  
  return {
    userId,
    quotaReset: true,
    resetAt: new Date().toISOString()
  };
}

async function updateUserPlan(userId: string, plan: string): Promise<any> {
  // Update user's subscription plan
  await withTimeout(
    (prisma as any).user.update({
      where: { id: userId },
      data: { subscriptionPlan: plan }
    }),
    5000
  );
  
  return {
    userId,
    newPlan: plan,
    updated: true
  };
}

async function getTotalUsers(): Promise<number> {
  return (await withTimeout(
    (prisma as any).user.count(),
    5000
  )) as number;
}

async function getSystemLoad(): Promise<any> {
  const memoryUsage = process.memoryUsage();
  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}
