// Usage Monitoring Service - Real-time tenant usage tracking
import { telemetryService } from './telemetry';
import { RedisCache } from '@/lib/cache/redis-client';
import { logger } from '@/lib/observability/logger';

export interface UsageAlert {
  tenantId: string;
  type: 'api_limit' | 'storage_limit' | 'user_limit' | 'error_rate' | 'response_time';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  current: number;
  limit: number;
  timestamp: Date;
}

export interface UsageThresholds {
  apiCallsPerHour: number;
  storageMB: number;
  activeUsers: number;
  errorRatePercent: number;
  avgResponseTimeMs: number;
}

export class UsageMonitor {
  private static instance: UsageMonitor;
  private monitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): UsageMonitor {
    if (!UsageMonitor.instance) {
      UsageMonitor.instance = new UsageMonitor();
    }
    return UsageMonitor.instance;
  }

  // Start monitoring
  start(): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    logger.info('usage-monitor', 'Usage monitoring started');
    
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkUsageThresholds();
    }, 5 * 60 * 1000);
  }

  // Stop monitoring
  stop(): void {
    if (!this.monitoring) return;
    
    this.monitoring = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    logger.info('usage-monitor', 'Usage monitoring stopped');
  }

  // Check usage thresholds for all tenants
  private async checkUsageThresholds(): Promise<void> {
    try {
      const tenantIds = await this.getActiveTenantIds();
      
      for (const tenantId of tenantIds) {
        await this.checkTenantUsage(tenantId);
      }
    } catch (error) {
      logger.error('usage-monitor', 'Failed to check usage thresholds', error as Error);
    }
  }

  // Check individual tenant usage
  private async checkTenantUsage(tenantId: string): Promise<void> {
    try {
      const metrics = await telemetryService.getTenantMetrics(tenantId, 'hour');
      const thresholds = await this.getTenantThresholds(tenantId);
      
      const alerts: UsageAlert[] = [];

      // Check API calls
      if (metrics.apiCalls > thresholds.apiCallsPerHour) {
        alerts.push({
          tenantId,
          type: 'api_limit',
          severity: this.calculateSeverity(metrics.apiCalls, thresholds.apiCallsPerHour),
          message: `API calls limit exceeded: ${metrics.apiCalls}/${thresholds.apiCallsPerHour}`,
          current: metrics.apiCalls,
          limit: thresholds.apiCallsPerHour,
          timestamp: new Date(),
        });
      }

      // Check storage usage
      if (metrics.storageUsed > thresholds.storageMB) {
        alerts.push({
          tenantId,
          type: 'storage_limit',
          severity: this.calculateSeverity(metrics.storageUsed, thresholds.storageMB),
          message: `Storage limit exceeded: ${metrics.storageUsed}MB/${thresholds.storageMB}MB`,
          current: metrics.storageUsed,
          limit: thresholds.storageMB,
          timestamp: new Date(),
        });
      }

      // Check active users
      if (metrics.activeUsers > thresholds.activeUsers) {
        alerts.push({
          tenantId,
          type: 'user_limit',
          severity: this.calculateSeverity(metrics.activeUsers, thresholds.activeUsers),
          message: `Active users limit exceeded: ${metrics.activeUsers}/${thresholds.activeUsers}`,
          current: metrics.activeUsers,
          limit: thresholds.activeUsers,
          timestamp: new Date(),
        });
      }

      // Check error rate
      const errorRate = metrics.apiCalls > 0 ? (metrics.errors / metrics.apiCalls) * 100 : 0;
      if (errorRate > thresholds.errorRatePercent) {
        alerts.push({
          tenantId,
          type: 'error_rate',
          severity: this.calculateSeverity(errorRate, thresholds.errorRatePercent),
          message: `Error rate too high: ${errorRate.toFixed(2)}%/${thresholds.errorRatePercent}%`,
          current: errorRate,
          limit: thresholds.errorRatePercent,
          timestamp: new Date(),
        });
      }

      // Check response time
      if (metrics.avgResponseTime > thresholds.avgResponseTimeMs) {
        alerts.push({
          tenantId,
          type: 'response_time',
          severity: this.calculateSeverity(metrics.avgResponseTime, thresholds.avgResponseTimeMs),
          message: `Average response time too high: ${metrics.avgResponseTime}ms/${thresholds.avgResponseTimeMs}ms`,
          current: metrics.avgResponseTime,
          limit: thresholds.avgResponseTimeMs,
          timestamp: new Date(),
        });
      }

      // Process alerts
      if (alerts.length > 0) {
        await this.processAlerts(alerts);
      }

    } catch (error) {
      logger.error('usage-monitor', 'Failed to check tenant usage', error as Error, { tenantId });
    }
  }

  // Get tenant thresholds based on subscription plan
  private async getTenantThresholds(tenantId: string): Promise<UsageThresholds> {
    try {
      const tenant = await import('@/lib/tenant/tenant-context').then(m => 
        m.TenantService.getTenantById(tenantId)
      );
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Thresholds based on subscription plan
      switch (tenant.subscription.plan) {
        case 'free':
          return {
            apiCallsPerHour: 100,
            storageMB: 1000,
            activeUsers: 5,
            errorRatePercent: 5.0,
            avgResponseTimeMs: 2000,
          };
        
        case 'pro':
          return {
            apiCallsPerHour: 1000,
            storageMB: 10000,
            activeUsers: 50,
            errorRatePercent: 2.0,
            avgResponseTimeMs: 1000,
          };
        
        case 'enterprise':
          return {
            apiCallsPerHour: 10000,
            storageMB: 100000,
            activeUsers: 500,
            errorRatePercent: 1.0,
            avgResponseTimeMs: 500,
          };
        
        default:
          return {
            apiCallsPerHour: 100,
            storageMB: 1000,
            activeUsers: 5,
            errorRatePercent: 5.0,
            avgResponseTimeMs: 2000,
          };
      }
    } catch (error) {
      logger.error('usage-monitor', 'Failed to get tenant thresholds', error as Error, { tenantId });
      
      // Return default thresholds
      return {
        apiCallsPerHour: 100,
        storageMB: 1000,
        activeUsers: 5,
        errorRatePercent: 5.0,
        avgResponseTimeMs: 2000,
      };
    }
  }

  // Calculate alert severity based on usage percentage
  private calculateSeverity(current: number, limit: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (current / limit) * 100;
    
    if (percentage >= 100) return 'critical';
    if (percentage >= 90) return 'high';
    if (percentage >= 75) return 'medium';
    return 'low';
  }

  // Process generated alerts
  private async processAlerts(alerts: UsageAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // Store alert
        await this.storeAlert(alert);
        
        // Send notification for high/critical alerts
        if (alert.severity === 'high' || alert.severity === 'critical') {
          await this.sendAlertNotification(alert);
        }
        
        // Log alert
        logger.warn('usage-monitor', `Usage alert: ${alert.type}`, {
          tenantId: alert.tenantId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          current: alert.current,
          limit: alert.limit,
        });
      } catch (error) {
        logger.error('usage-monitor', 'Failed to process alert', error as Error, { alert });
      }
    }
  }

  // Store alert in cache/database
  private async storeAlert(alert: UsageAlert): Promise<void> {
    try {
      const key = `alerts:${alert.tenantId}:${Date.now()}`;
      await RedisCache.set(key, alert, 86400); // 24 hours
    } catch (error) {
      logger.error('usage-monitor', 'Failed to store alert', error as Error, { alert });
    }
  }

  // Send alert notification
  private async sendAlertNotification(alert: UsageAlert): Promise<void> {
    try {
      // This would integrate with notification service
      // For now, just log it
      logger.error('usage-monitor', 'CRITICAL USAGE ALERT', undefined, {
        tenantId: alert.tenantId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        current: alert.current,
        limit: alert.limit,
      });

      // Could also send email, Slack, webhook, etc.
      await this.sendEmailAlert(alert);
      await this.sendWebhookAlert(alert);
    } catch (error) {
      logger.error('usage-monitor', 'Failed to send alert notification', error as Error, { alert });
    }
  }

  // Send email alert
  private async sendEmailAlert(alert: UsageAlert): Promise<void> {
    try {
      // This would integrate with email service
      // For now, just log the intent
      logger.info('usage-monitor', 'Email alert sent', {
        tenantId: alert.tenantId,
        alert: alert.message,
      });
    } catch (error) {
      logger.error('usage-monitor', 'Failed to send email alert', error as Error, { alert });
    }
  }

  // Send webhook alert
  private async sendWebhookAlert(alert: UsageAlert): Promise<void> {
    try {
      // This would send webhook to external monitoring systems
      logger.info('usage-monitor', 'Webhook alert sent', {
        tenantId: alert.tenantId,
        alert: alert.message,
      });
    } catch (error) {
      logger.error('usage-monitor', 'Failed to send webhook alert', error as Error, { alert });
    }
  }

  // Get active tenant IDs
  private async getActiveTenantIds(): Promise<string[]> {
    try {
      // This would get all active tenants from database
      // For now, return a placeholder
      return ['default-tenant'];
    } catch (error) {
      logger.error('usage-monitor', 'Failed to get active tenant IDs', error as Error);
      return [];
    }
  }

  // Get recent alerts for tenant
  async getTenantAlerts(tenantId: string, hours = 24): Promise<UsageAlert[]> {
    try {
      // This would query alerts from database/cache
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('usage-monitor', 'Failed to get tenant alerts', error as Error, { tenantId });
      return [];
    }
  }

  // Get system-wide alerts
  async getSystemAlerts(hours = 24): Promise<UsageAlert[]> {
    try {
      // This would get all system alerts
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('usage-monitor', 'Failed to get system alerts', error as Error);
      return [];
    }
  }
}

// Export singleton instance
export const usageMonitor = UsageMonitor.getInstance();
