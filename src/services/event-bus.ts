// Enterprise Event Bus - Microservices Communication Layer
// Uses Redis Pub/Sub for event-driven architecture

import Redis from 'ioredis';

export interface Event {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  service: string;
  tenantId: string;
  userId?: string;
  idempotencyKey?: string;
}

export class EventBus {
  private redis: Redis;
  private subscribers: Map<string, Array<(event: Event) => Promise<void>>> = new Map();
  private isConnected: boolean = false;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.setupConnectionHandlers();
    this.startSubscriber();
  }

  private setupConnectionHandlers(): void {
    this.redis.on('connect', () => {
      console.log('✅ EventBus connected to Redis');
      this.isConnected = true;
    });

    this.redis.on('error', (err) => {
      console.error('❌ EventBus Redis error:', err);
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 EventBus reconnecting to Redis...');
    });
  }

  private startSubscriber(): void {
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message) as Event;
        const handlers = this.subscribers.get(event.type) || [];
        
        // Execute handlers asynchronously
        handlers.forEach(handler => {
          handler(event).catch(err => {
            console.error(`❌ Event handler error for ${event.type}:`, err);
          });
        });
      } catch (err) {
        console.error('❌ Failed to parse event message:', err);
      }
    });

    // Subscribe to all event channels
    subscriber.psubscribe('events:*');
  }

  // Publish event to bus
  async publish(event: Event): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️  EventBus not connected, queuing event');
      // Could implement local queue here for offline mode
    }

    const channel = `events:${event.type}`;
    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString(),
    });

    try {
      // Publish to channel
      await this.redis.publish(channel, message);

      // Persist for replay and audit
      await this.persistEvent(event);

      console.log(`📤 Event published: ${event.type} → ${channel}`);
    } catch (err) {
      console.error(`❌ Failed to publish event ${event.type}:`, err);
      // Don't throw - events should be fire-and-forget
    }
  }

  // Persist event for replay/audit
  private async persistEvent(event: Event): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Add to tenant history
    pipeline.lpush(
      `events:tenant:${event.tenantId}`,
      JSON.stringify(event)
    );
    pipeline.ltrim(`events:tenant:${event.tenantId}`, 0, 999); // Keep last 1000

    // Add to event type stream
    pipeline.xadd(
      `stream:${event.type}`,
      '*', // Auto-generate ID
      'data', JSON.stringify(event)
    );

    // Set TTL on stream (7 days)
    pipeline.expire(`stream:${event.type}`, 7 * 24 * 60 * 60);

    await pipeline.exec();
  }

  // Subscribe to event type
  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    this.subscribers.get(eventType)!.push(handler);
    console.log(`📥 Subscribed to: ${eventType}`);
  }

  // Unsubscribe from event type
  unsubscribe(eventType: string, handler: (event: Event) => Promise<void>): void {
    const handlers = this.subscribers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  // Get event history for tenant
  async getEventHistory(tenantId: string, limit: number = 100): Promise<Event[]> {
    const events = await this.redis.lrange(
      `events:tenant:${tenantId}`,
      0,
      limit - 1
    );

    return events.map(e => JSON.parse(e) as Event);
  }

  // Replay events (for recovery)
  async replayEvents(
    tenantId: string,
    fromTimestamp: Date,
    toTimestamp: Date
  ): Promise<Event[]> {
    const allEvents = await this.getEventHistory(tenantId, 1000);
    
    return allEvents.filter(e => {
      const eventTime = new Date(e.timestamp);
      return eventTime >= fromTimestamp && eventTime <= toTimestamp;
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    await this.redis.quit();
    this.isConnected = false;
    console.log('👋 EventBus disconnected');
  }
}

// Event type definitions
export const Events = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Lead Events
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_DELETED: 'lead.deleted',
  LEAD_ASSIGNED: 'lead.assigned',
  LEAD_CONVERTED: 'lead.converted',
  
  // Deal Events
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_WON: 'deal.won',
  DEAL_LOST: 'deal.lost',
  
  // Billing Events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  
  // AI Events
  AI_INSIGHT_GENERATED: 'ai.insight_generated',
  AI_LEAD_SCORED: 'ai.lead_scored',
  
  // System Events
  EXPORT_COMPLETED: 'export.completed',
  IMPORT_COMPLETED: 'import.completed',
  BACKUP_COMPLETED: 'backup.completed',
  
  // Real-time Events
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  ACTIVITY_LOGGED: 'activity.logged',
} as const;

// Global singleton
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

// Export for direct import
export const eventBus = getEventBus();
