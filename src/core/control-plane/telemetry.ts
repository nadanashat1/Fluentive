// Control Plane - Telemetry and Usage Metrics for Production SaaS
import { saasExecutor } from '@/core/saas-executor';
import { RedisCache } from '@/lib/cache/redis-client';
import { logger } from '@/lib/observability/logger';

export interface TenantUsageMetrics {
  tenantId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  apiCalls: number;
  dataQueries: number;
  cacheHits: number;
  cacheMisses: number;
  backgroundJobs: number;
  errors: number;
  avgResponseTime: number;
  storageUsed: number; // MB
  activeUsers: number;
  lastUpdated: Date;
}

export interface SystemMetrics {
  totalTenants: number;
  activeTenants: number;
  totalApiCalls: number;
  totalErrors: number;
  avgResponseTime: number;
  cacheHitRate: number;
  queueSize: number;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  lastUpdated: Date;
}

export class TelemetryService {
  private static instance: TelemetryService;
  private metricsBuffer = new Map<string, Partial<TenantUsageMetrics>>();

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  // Record API call for tenant
  async recordApiCall(tenantId: string, operation: string, duration: number, success: boolean): Promise<void> {
    const key = `telemetry:${tenantId}:${this.getCurrentHour()}`;
    
    try {
      const current = await RedisCache.get<Partial<TenantUsageMetrics>>(key) || {
        tenantId,
        period: 'hour',
        apiCalls: 0,
        dataQueries: 0,
        cacheHits: 0,
        cacheMisses: 0,
        backgroundJobs: 0,
        errors: 0,
        avgResponseTime: 0,
        storageUsed: 0,
        activeUsers: 0,
        lastUpdated: new Date(),
      };

      current.apiCalls = (current.apiCalls || 0) + 1;
      current.avgResponseTime = this.updateAverage(current.avgResponseTime || 0, current.apiCalls, duration);
      
      if (!success) {
        current.errors = (current.errors || 0) + 1;
      }

      await RedisCache.set(key, current, 3600); // 1 hour TTL
    } catch (error) {
      logger.error('telemetry', 'Failed to record API call', error as Error, { tenantId, operation });
    }
  }

  // Record cache hit/miss
  async recordCacheHit(tenantId: string, hit: boolean): Promise<void> {
    const key = `telemetry:${tenantId}:${this.getCurrentHour()}`;
    
    try {
      const current = await RedisCache.get<Partial<TenantUsageMetrics>>(key) || {};
      
      if (hit) {
        current.cacheHits = (current.cacheHits || 0) + 1;
      } else {
        current.cacheMisses = (current.cacheMisses || 0) + 1;
      }

      await RedisCache.set(key, current, 3600);
    } catch (error) {
      logger.error('telemetry', 'Failed to record cache hit', error as Error, { tenantId, hit });
    }
  }

  // Record background job
  async recordBackgroundJob(tenantId: string, jobType: string, success: boolean): Promise<void> {
    const key = `telemetry:${tenantId}:${this.getCurrentHour()}`;
    
    try {
      const current = await RedisCache.get<Partial<TenantUsageMetrics>>(key) || {};
      
      current.backgroundJobs = (current.backgroundJobs || 0) + 1;
      if (!success) {
        current.errors = (current.errors || 0) + 1;
      }

      await RedisCache.set(key, current, 3600);
    } catch (error) {
      logger.error('telemetry', 'Failed to record background job', error as Error, { tenantId, jobType });
    }
  }

  // Get tenant usage metrics
  async getTenantMetrics(tenantId: string, period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<TenantUsageMetrics> {
    const keys = this.getTimeRangeKeys(tenantId, period);
    
    try {
      const metrics = await Promise.all(
        keys.map(key => RedisCache.get<Partial<TenantUsageMetrics>>(key))
      );

      const aggregated: TenantUsageMetrics = {
        tenantId,
        period,
        apiCalls: 0,
        dataQueries: 0,
        cacheHits: 0,
        cacheMisses: 0,
        backgroundJobs: 0,
        errors: 0,
        avgResponseTime: 0,
        storageUsed: 0,
        activeUsers: 0,
        lastUpdated: new Date(),
      };

      // Aggregate all metrics
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      metrics.forEach(metric => {
        if (metric) {
          aggregated.apiCalls += metric.apiCalls || 0;
          aggregated.dataQueries += metric.dataQueries || 0;
          aggregated.cacheHits += metric.cacheHits || 0;
          aggregated.cacheMisses += metric.cacheMisses || 0;
          aggregated.backgroundJobs += metric.backgroundJobs || 0;
          aggregated.errors += metric.errors || 0;
          
          if (metric.avgResponseTime) {
            totalResponseTime += metric.avgResponseTime;
            responseTimeCount++;
          }
        }
      });

      aggregated.avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
      aggregated.storageUsed = await this.getTenantStorageUsage(tenantId);
      aggregated.activeUsers = await this.getTenantActiveUsers(tenantId);

      return aggregated;
    } catch (error) {
      logger.error('telemetry', 'Failed to get tenant metrics', error as Error, { tenantId, period });
      throw error;
    }
  }

  // Get system-wide metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get all tenant keys
      const tenantKeys = await this.getAllTenantKeys();
      
      let totalApiCalls = 0;
      let totalErrors = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let totalCacheHits = 0;
      let totalCacheMisses = 0;
      let activeTenants = 0;

      for (const tenantId of tenantKeys) {
        const metrics = await this.getTenantMetrics(tenantId, 'hour');
        
        totalApiCalls += metrics.apiCalls;
        totalErrors += metrics.errors;
        totalCacheHits += metrics.cacheHits;
        totalCacheMisses += metrics.cacheMisses;
        
        if (metrics.apiCalls > 0) {
          activeTenants++;
        }
        
        if (metrics.avgResponseTime > 0) {
          totalResponseTime += metrics.avgResponseTime;
          responseTimeCount++;
        }
      }

      const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
      const cacheHitRate = (totalCacheHits + totalCacheMisses) > 0 
        ? totalCacheHits / (totalCacheHits + totalCacheMisses) 
        : 0;

      // Get queue size from background processor
      const queueStats = saasExecutor.getExecutionStats();
      
      return {
        totalTenants: tenantKeys.length,
        activeTenants,
        totalApiCalls,
        totalErrors,
        avgResponseTime,
        cacheHitRate,
        queueSize: queueStats ? Object.keys(queueStats).length : 0,
        systemHealth: this.determineSystemHealth(avgResponseTime, totalErrors, totalApiCalls),
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('telemetry', 'Failed to get system metrics', error as Error);
      throw error;
    }
  }

  // Get usage analytics for billing
  async getUsageForBilling(tenantId: string, period: 'month' = 'month'): Promise<{
    apiCalls: number;
    storageUsed: number;
    activeUsers: number;
    plan: string;
    overages: {
      apiCalls: number;
      storage: number;
      users: number;
    };
  }> {
    try {
      const metrics = await this.getTenantMetrics(tenantId, period);
      
      // Get tenant plan limits
      const tenant = await import('@/lib/tenant/tenant-context').then(m => 
        m.TenantService.getTenantById(tenantId)
      );
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const overages = {
        apiCalls: Math.max(0, metrics.apiCalls - 10000), // Example: 10k API calls included
        storage: Math.max(0, metrics.storageUsed - tenant.settings.limits.storage),
        users: Math.max(0, metrics.activeUsers - tenant.settings.maxUsers),
      };

      return {
        apiCalls: metrics.apiCalls,
        storageUsed: metrics.storageUsed,
        activeUsers: metrics.activeUsers,
        plan: tenant.subscription.plan,
        overages,
      };
    } catch (error) {
      logger.error('telemetry', 'Failed to get billing usage', error as Error, { tenantId });
      throw error;
    }
  }

  // Private helper methods
  private getCurrentHour(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
  }

  private getTimeRangeKeys(tenantId: string, period: 'hour' | 'day' | 'week' | 'month'): string[] {
    const now = new Date();
    const keys: string[] = [];
    
    let hours = 1;
    switch (period) {
      case 'hour':
        hours = 1;
        break;
      case 'day':
        hours = 24;
        break;
      case 'week':
        hours = 24 * 7;
        break;
      case 'month':
        hours = 24 * 30;
        break;
    }
    
    for (let i = 0; i < hours; i++) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}-${String(time.getHours()).padStart(2, '0')}`;
      keys.push(`telemetry:${tenantId}:${key}`);
    }
    
    return keys;
  }

  private async getAllTenantKeys(): Promise<string[]> {
    // This would require Redis scan operation
    // For now, return a placeholder
    return ['default-tenant'];
  }

  private async getTenantStorageUsage(tenantId: string): Promise<number> {
    // This would integrate with file storage system
    // For now, return a placeholder
    return 100; // MB
  }

  private async getTenantActiveUsers(tenantId: string): Promise<number> {
    // This would check user activity logs
    // For now, return a placeholder
    return 5;
  }

  private updateAverage(currentAvg: number, count: number, newValue: number): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }

  private determineSystemHealth(avgResponseTime: number, totalErrors: number, totalApiCalls: number): 'healthy' | 'degraded' | 'unhealthy' {
    const errorRate = totalApiCalls > 0 ? totalErrors / totalApiCalls : 0;
    
    if (avgResponseTime > 5000 || errorRate > 0.1) {
      return 'unhealthy';
    } else if (avgResponseTime > 2000 || errorRate > 0.05) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
}

// Export singleton instance
export const telemetryService = TelemetryService.getInstance();
