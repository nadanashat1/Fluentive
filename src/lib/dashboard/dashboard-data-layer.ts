// 🚀 Production-Grade Dashboard Data Layer
// Unified fetching, caching, and aggregation system

import { authenticatedFetch } from '@/lib/api/auth-interceptor';
import { ROUTES } from '@/lib/api-endpoints';

// ✅ CRITICAL: Request deduplication cache
interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
    ttl: number;
  };
}

const requestCache: RequestCache = {};
const CACHE_TTL = 30 * 1000; // 30 seconds

// ✅ CRITICAL: Dashboard data interfaces
interface DashboardMetrics {
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
    activeDeals: number;
    pipelineValue: number;
    daily: Array<{ date: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    bySource: Array<{ source: string; count: number }>;
  };
  users: {
    total: number;
    active: number;
    online: number;
    newThisWeek: number;
    roleBreakdown: Array<{ role: string; count: number }>;
  };
  engagement: {
    recent: Array<{
      id: string;
      action: string;
      timestamp: string;
      user?: string;
      details?: string;
    }>;
    totalToday: number;
    thisWeek: number;
    heatmap: Array<{ hour: number; activity: number }>;
  };
  timeTracking: {
    today: {
      totalHours: string;
      activeHours: string;
      trackedUsers: number;
      isActive: boolean;
      efficiency: number;
    };
    weekly: {
      totalHours: string;
      productivity: number;
      topPerformers: Array<{ user: string; hours: string }>;
    };
  };
  ai: {
    overview: {
      totalLeadsScored: number;
      averageScore: number;
      highPriorityCount: number;
      conversionReadyCount: number;
      needsAttentionCount: number;
      predictedConversionsThisWeek: number;
    };
    topOpportunities: Array<{
      leadId: string;
      name: string;
      score: number;
      status: string;
      recommendedAction: string;
    }>;
    actionItems: string[];
    performancePrediction: {
      expectedConversions: number;
      confidence: number;
      trend: string;
    };
    monthlyTrends: Array<{ month: string; leadsCreated: number; leadsConverted: number; revenue: number }>;
    scoreDistribution: number[];
  };
  system: {
    apiLatency: number;
    cacheHitRate: number;
    errorRate: number;
    lastUpdate: string;
    health: 'healthy' | 'degraded' | 'critical';
  };
}

// ✅ CRITICAL: Cache management
function getCacheKey(endpoint: string, params?: any): string {
  return `${endpoint}${params ? JSON.stringify(params) : ''}`;
}

function isCacheValid(cacheEntry: RequestCache[string]): boolean {
  return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
}

// ✅ CRITICAL: Deduplicated fetch with caching
async function deduplicatedFetch<T>(endpoint: string, params?: any): Promise<T> {
  const cacheKey = getCacheKey(endpoint, params);
  const cached = requestCache[cacheKey];

  if (cached && isCacheValid(cached)) {
    console.log(`[Dashboard] Cache hit for: ${endpoint}`);
    return cached.promise;
  }

  console.log(`[Dashboard] Cache miss, fetching: ${endpoint}`);
  const startTime = Date.now();
  
  const promise = authenticatedFetch<T>(endpoint, {
    method: 'GET',
    headers: {
      'X-Dashboard-Request': 'true',
      ...(params && { 'X-Request-Params': JSON.stringify(params) })
    }
  });

  const enhancedPromise = promise.then(data => {
    const duration = Date.now() - startTime;
    console.log(`[Dashboard] API timing: ${endpoint} - ${duration}ms`);
    
    // ✅ CRITICAL: Update system metrics
    if (window.__DASHBOARD_METRICS__) {
      window.__DASHBOARD_METRICS__.apiLatency = duration;
      window.__DASHBOARD_METRICS__.lastUpdate = new Date().toISOString();
    }
    
    return data;
  });

  requestCache[cacheKey] = {
    promise: enhancedPromise,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  };

  return enhancedPromise;
}

// ✅ CRITICAL: Unified dashboard data fetcher
export async function fetchDashboardData(dateRange: string = '7d'): Promise<DashboardMetrics> {
  const startTime = Date.now();
  
  try {
    console.log(`[Dashboard] Starting unified fetch for range: ${dateRange}`);

    // Helper to extract data from API response
    const extractData = (res: any) => {
      if (!res) return null;
      if (res.success && res.data) return res.data;
      return res; // Fallback for direct data return
    };

    // ✅ CRITICAL: Coordinated parallel fetching with Promise.all
    const [
      dashboardRes,
      aiRes,
      usersRes
    ] = await Promise.allSettled([
      deduplicatedFetch(ROUTES.dashboard.summary, { dateRange }),
      deduplicatedFetch(ROUTES.ai.dashboard).catch(() => null),
      deduplicatedFetch('/api/users/summary').catch(() => null)
    ]);

    const dashboardData = dashboardRes.status === 'fulfilled' ? extractData(dashboardRes.value) : null;
    const aiData = aiRes.status === 'fulfilled' ? extractData(aiRes.value) : null;
    const usersData = usersRes.status === 'fulfilled' ? extractData(usersRes.value) : null;

    // ✅ CRITICAL: Graceful partial failure handling with type safety
    const metrics: DashboardMetrics = {
      leads: {
        total: dashboardData?.totalLeads ?? 0,
        converted: dashboardData?.convertedLeads ?? 0,
        conversionRate: dashboardData?.conversionRate ?? 0,
        activeDeals: dashboardData?.activeDeals ?? 0,
        pipelineValue: dashboardData?.pipelineValue ?? 0,
        daily: dashboardData?.dailyLeads ?? [],
        byStatus: dashboardData?.byStatus ?? [],
        bySource: dashboardData?.bySource ?? []
      },
      users: {
        total: usersData?.total ?? 0,
        active: usersData?.active ?? 0,
        online: dashboardData?.users?.online ?? 0,
        newThisWeek: usersData?.newThisWeek ?? 0,
        roleBreakdown: usersData?.roleBreakdown ?? []
      },
      engagement: {
        recent: dashboardData?.engagement?.recent ?? [],
        totalToday: 0,
        thisWeek: 0,
        heatmap: []
      },
      timeTracking: {
        today: {
          totalHours: dashboardData?.timeTracking?.today?.totalHours ?? '0h',
          activeHours: dashboardData?.timeTracking?.today?.activeHours ?? '0h',
          trackedUsers: dashboardData?.timeTracking?.today?.trackedUsers ?? 0,
          isActive: dashboardData?.timeTracking?.today?.isActive ?? false,
          efficiency: 0
        },
        weekly: {
          totalHours: '0h',
          productivity: 0,
          topPerformers: []
        }
      },
      ai: {
        overview: aiData?.overview || {
          totalLeadsScored: 0,
          averageScore: 0,
          highPriorityCount: 0,
          conversionReadyCount: 0,
          needsAttentionCount: 0,
          predictedConversionsThisWeek: 0
        },
        topOpportunities: aiData?.topOpportunities || [],
        actionItems: aiData?.actionItems || [],
        performancePrediction: aiData?.performancePrediction || {
          expectedConversions: 0,
          confidence: 0,
          trend: 'stable'
        },
        monthlyTrends: aiData?.monthlyTrends || [],
        scoreDistribution: aiData?.scoreDistribution || []
      },
      system: {
        apiLatency: Date.now() - startTime,
        cacheHitRate: calculateCacheHitRate(),
        errorRate: calculateErrorRate([dashboardRes, aiRes, usersRes]),
        lastUpdate: new Date().toISOString(),
        health: calculateSystemHealth([dashboardRes, aiRes, usersRes])
      }
    };

    console.log(`[Dashboard] Unified fetch completed in ${Date.now() - startTime}ms`);
    return metrics;


  } catch (error) {
    console.error('[Dashboard] Unified fetch failed:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}

// ✅ CRITICAL: System health calculations
function calculateCacheHitRate(): number {
  const total = Object.keys(requestCache).length;
  const hits = Object.values(requestCache).filter(cache => isCacheValid(cache)).length;
  return total > 0 ? (hits / total) * 100 : 0;
}

function calculateErrorRate(results: PromiseSettledResult<any>[]): number {
  const failed = results.filter(result => result.status === 'rejected').length;
  return (failed / results.length) * 100;
}

function calculateSystemHealth(results: PromiseSettledResult<any>[]): 'healthy' | 'degraded' | 'critical' {
  const errorRate = calculateErrorRate(results);
  if (errorRate === 0) return 'healthy';
  if (errorRate < 50) return 'degraded';
  return 'critical';
}

// ✅ CRITICAL: Cache cleanup for memory management
export function clearExpiredCache(): void {
  const now = Date.now();
  Object.keys(requestCache).forEach(key => {
    if (!isCacheValid(requestCache[key])) {
      delete requestCache[key];
    }
  });
}

// ✅ CRITICAL: Global metrics interface for observability
declare global {
  interface Window {
    __DASHBOARD_METRICS__?: {
      apiLatency: number;
      cacheHitRate: number;
      errorRate: number;
      lastUpdate: string;
      health: 'healthy' | 'degraded' | 'critical';
    };
  }
}

// ✅ CRITICAL: Initialize global metrics
if (typeof window !== 'undefined') {
  window.__DASHBOARD_METRICS__ = {
    apiLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    lastUpdate: new Date().toISOString(),
    health: 'healthy'
  };
}

export type { DashboardMetrics };
