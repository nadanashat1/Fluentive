// Production Observability System - Event-driven monitoring
import { EventBus } from './event-bus';

export interface MetricsData {
  operation: string;
  duration?: number;
  tenantId?: string;
  userId?: string;
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export class ObservabilitySystem {
  private static instance: ObservabilitySystem;
  private metrics = new Map<string, number[]>();
  private events: Array<{ event: string; data: any; timestamp: Date }> = [];

  static getInstance(): ObservabilitySystem {
    if (!ObservabilitySystem.instance) {
      ObservabilitySystem.instance = new ObservabilitySystem();
    }
    return ObservabilitySystem.instance;
  }

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Lead events
    EventBus.on('lead.created', (data) => {
      this.recordMetric('leads.created', { operation: 'leads.created', tenantId: data.tenantId });
      this.logEvent('lead.created', data);
    });

    EventBus.on('lead.updated', (data) => {
      this.recordMetric('leads.updated', { operation: 'leads.updated', tenantId: data.tenantId });
      this.logEvent('lead.updated', data);
    });

    EventBus.on('lead.deleted', (data) => {
      this.recordMetric('leads.deleted', { operation: 'leads.deleted', tenantId: data.tenantId });
      this.logEvent('lead.deleted', data);
    });

    EventBus.on('lead.retrieved', (data) => {
      this.recordMetric('leads.retrieved', { 
        operation: 'leads.retrieved',
        tenantId: data.tenantId,
        count: data.count 
      });
      this.logEvent('lead.retrieved', data);
    });

    EventBus.on('lead.cache_hit', (data) => {
      this.recordMetric('cache.hits', { operation: 'cache.hits', tenantId: data.tenantId });
      this.logEvent('cache.hit', data);
    });

    EventBus.on('lead.searched', (data) => {
      this.recordMetric('leads.searched', { 
        operation: 'leads.searched',
        tenantId: data.tenantId,
        queryLength: data.query.length 
      });
      this.logEvent('lead.searched', data);
    });

    EventBus.on('lead.stats_retrieved', (data) => {
      this.recordMetric('leads.stats_retrieved', { 
        operation: 'leads.stats_retrieved',
        tenantId: data.tenantId,
        total: data.total 
      });
      this.logEvent('lead.stats_retrieved', data);
    });
  }

  // Record metrics for monitoring
  private recordMetric(operation: string, data: MetricsData): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metricValues = this.metrics.get(operation)!;
    metricValues.push(Date.now());
    
    // Keep only last 1000 values
    if (metricValues.length > 1000) {
      metricValues.shift();
    }
  }

  // Log events for audit trail
  private logEvent(event: string, data: any): void {
    this.events.push({
      event,
      data,
      timestamp: new Date()
    });
    
    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events.shift();
    }
  }

  // Get performance metrics
  getMetrics(operation: string, timeWindow = 3600000): { count: number; rate: number } {
    const timestamps = this.metrics.get(operation) || [];
    const now = Date.now();
    const recentTimestamps = timestamps.filter(ts => now - ts < timeWindow);
    
    return {
      count: recentTimestamps.length,
      rate: recentTimestamps.length / (timeWindow / 1000) // per second
    };
  }

  // Get recent events
  getEvents(eventType?: string, limit = 100): Array<{ event: string; data: any; timestamp: Date }> {
    let filtered = this.events;
    
    if (eventType) {
      filtered = this.events.filter(e => e.event === eventType);
    }
    
    return filtered.slice(-limit);
  }

  // Get system health
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, any>;
    eventCount: number;
  } {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    const recentEvents = this.events.filter(e => e.timestamp.getTime() > last5Minutes);
    const errorEvents = recentEvents.filter(e => e.event.includes('error'));
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorEvents.length > recentEvents.length * 0.1) {
      status = 'unhealthy';
    } else if (errorEvents.length > recentEvents.length * 0.05) {
      status = 'degraded';
    }
    
    const metrics: Record<string, any> = {};
    for (const [operation] of this.metrics) {
      metrics[operation] = this.getMetrics(operation);
    }
    
    return {
      status,
      metrics,
      eventCount: recentEvents.length
    };
  }

  // Export metrics for external monitoring
  exportMetrics(): string {
    const metrics: Record<string, any> = {};
    
    for (const [operation, timestamps] of this.metrics) {
      const now = Date.now();
      const lastHour = timestamps.filter(ts => now - ts < 3600000);
      const lastMinute = timestamps.filter(ts => now - ts < 60000);
      
      metrics[operation] = {
        total: timestamps.length,
        lastHour: lastHour.length,
        lastMinute: lastMinute.length,
        ratePerMinute: lastMinute.length,
        ratePerHour: lastHour.length
      };
    }
    
    return JSON.stringify(metrics, null, 2);
  }

  // Clear all metrics and events
  clear(): void {
    this.metrics.clear();
    this.events = [];
  }
}

// Export singleton instance
export const observability = ObservabilitySystem.getInstance();
