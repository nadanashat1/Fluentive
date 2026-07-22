import { NextRequest } from 'next/server';

/**
 * Memory monitoring and alerting for Vercel Hobby Plan
 * Tracks memory usage and provides alerts for optimization
 */

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  usagePercent: number;
  timestamp: string;
}

interface MemoryAlert {
  level: 'warning' | 'critical' | 'emergency';
  message: string;
  usage: string;
  timestamp: string;
}

class MemoryMonitor {
  private alerts: MemoryAlert[] = [];
  private maxAlerts = 10; // Keep only last 10 alerts
  private thresholds = {
    warning: 70,    // 70% heap usage
    critical: 85,   // 85% heap usage
    emergency: 98   // 98% heap usage
  };

  /**
   * Get current memory statistics
   */
  getCurrentStats(): MemoryStats | null {
    // Check if we're in Edge Runtime (no process.memoryUsage)
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        usagePercent: 0,
        timestamp: new Date().toISOString()
      };
    }

    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed / 1024 / 1024; // MB
    const heapTotal = usage.heapTotal / 1024 / 1024; // MB
    const usagePercent = (heapUsed / heapTotal) * 100;

    return {
      heapUsed: Math.round(heapUsed * 100) / 100,
      heapTotal: Math.round(heapTotal * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      usagePercent: Math.round(usagePercent * 100) / 100,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check memory and generate alerts if needed
   */
  checkMemory(): MemoryAlert[] {
    const stats = this.getCurrentStats();
    if (!stats) return [];

    const newAlerts: MemoryAlert[] = [];
    const now = new Date().toISOString();

    if (stats.usagePercent >= this.thresholds.emergency) {
      newAlerts.push({
        level: 'emergency',
        message: 'Emergency: Memory usage critically high - immediate action required',
        usage: `${stats.heapUsed}MB / ${stats.heapTotal}MB (${stats.usagePercent}%)`,
        timestamp: now
      });
    } else if (stats.usagePercent >= this.thresholds.critical) {
      newAlerts.push({
        level: 'critical',
        message: 'Critical: Memory usage very high - optimize immediately',
        usage: `${stats.heapUsed}MB / ${stats.heapTotal}MB (${stats.usagePercent}%)`,
        timestamp: now
      });
    } else if (stats.usagePercent >= this.thresholds.warning) {
      newAlerts.push({
        level: 'warning',
        message: 'Warning: Memory usage elevated - monitor closely',
        usage: `${stats.heapUsed}MB / ${stats.heapTotal}MB (${stats.usagePercent}%)`,
        timestamp: now
      });
    }

    // Add new alerts to history
    this.alerts.push(...newAlerts);
    
    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return newAlerts;
  }

  /**
   * Get recent alerts
   */
  getAlerts(): MemoryAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alert history
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get memory health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    stats: MemoryStats | null;
    alerts: MemoryAlert[];
    recommendations: string[];
  } {
    const stats = this.getCurrentStats();
    const alerts = this.getAlerts();
    const recentAlerts = alerts.filter(a => 
      new Date(a.timestamp).getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    );

    let status: 'healthy' | 'warning' | 'critical' | 'emergency' = 'healthy';
    const recommendations: string[] = [];

    if (!stats) {
      return {
        status: 'healthy',
        stats: null,
        alerts: [],
        recommendations: []
      };
    }

    if (stats.usagePercent >= this.thresholds.emergency) {
      status = 'emergency';
      recommendations.push(
        'Immediately reduce memory usage',
        'Consider scaling to Pro plan',
        'Implement aggressive caching limits'
      );
    } else if (stats.usagePercent >= this.thresholds.critical) {
      status = 'critical';
      recommendations.push(
        'Optimize database queries',
        'Reduce payload sizes',
        'Implement pagination limits'
      );
    } else if (stats.usagePercent >= this.thresholds.warning) {
      status = 'warning';
      recommendations.push(
        'Monitor memory trends',
        'Consider query optimization',
        'Review caching strategy'
      );
    }

    return {
      status,
      stats,
      alerts: recentAlerts,
      recommendations
    };
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

/**
 * Middleware to check memory on API requests
 */
export function withMemoryCheck(handler: (req: Request | NextRequest) => Promise<Response>) {
  return async (req: Request | NextRequest): Promise<Response> => {
    // Check memory before request
    const preCheck = memoryMonitor.checkMemory();
    
    // If emergency level, reject request
    const emergencyAlert = preCheck.find(a => a.level === 'emergency');
    if (emergencyAlert) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Service temporarily unavailable - high memory usage',
          memory: emergencyAlert.usage,
          timestamp: emergencyAlert.timestamp
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      const response = await handler(req);
      
      // Add memory headers to response
      const stats = memoryMonitor.getCurrentStats();
      if (stats) {
        response.headers.set('X-Memory-Usage', stats.usagePercent.toString() + '%');
        response.headers.set('X-Memory-Heap', `${stats.heapUsed}MB`);
      }

      return response;
    } catch (error) {
      // Check memory after error
      const postCheck = memoryMonitor.checkMemory();
      
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
          memory: postCheck.length > 0 ? postCheck[0].usage : undefined
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}
