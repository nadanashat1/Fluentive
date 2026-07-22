// INFRASTRUCTURE LAYER: Outbox Event Processor
// Ensures reliable event delivery with retry guarantees

import type { OutboxEvent } from '@domain/core/TransactionalEngine';
import type { IEventPublisher } from '@domain/interfaces/services.interface';

export interface OutboxProcessorConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  processingTimeoutMs: number;
}

export class OutboxProcessor {
  private isProcessing = false;
  private config: OutboxProcessorConfig;

  constructor(
    private eventPublisher: IEventPublisher,
    config: Partial<OutboxProcessorConfig> = {}
  ) {
    this.config = {
      batchSize: 50,
      maxRetries: 3,
      retryDelayMs: 5000,
      processingTimeoutMs: 30000,
      ...config
    };
  }

  // 🚀 MAIN PROCESSING LOOP - Runs continuously
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      console.log('⚠️ OutboxProcessor already running');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 OutboxProcessor started');

    while (this.isProcessing) {
      try {
        await this.processBatch();
        await this.sleep(1000); // 1 second between batches
      } catch (error) {
        console.error('❌ OutboxProcessor error:', error);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    console.log('⏹️ OutboxProcessor stopped');
  }

  // 🔒 PROCESS BATCH OF EVENTS
  private async processBatch(): Promise<void> {
    // Get pending events from database
    const pendingEvents = await this.getPendingEvents(this.config.batchSize);
    
    if (pendingEvents.length === 0) {
      return;
    }

    console.log(`📦 Processing ${pendingEvents.length} outbox events`);

    // Process events in parallel with limited concurrency
    const processingPromises = pendingEvents.map(event => 
      this.processEvent(event)
    );

    await Promise.allSettled(processingPromises);
  }

  // 🔒 PROCESS SINGLE EVENT WITH RETRY LOGIC
  private async processEvent(event: OutboxEvent): Promise<void> {
    try {
      // Mark as processing to prevent duplicate processing
      await this.markEventAsProcessing(event.id);

      // Publish the event
      await this.publishEvent(event);

      // Mark as completed
      await this.markEventAsCompleted(event.id);

      console.log(`✅ Event processed: ${event.eventType} (${event.id})`);

    } catch (error) {
      console.error(`❌ Event processing failed: ${event.eventType} (${event.id})`, error);
      
      // Handle retry logic
      await this.handleFailedEvent(event, error as Error);
    }
  }

  // 🔒 PUBLISH EVENT WITH TIMEOUT
  private async publishEvent(event: OutboxEvent): Promise<void> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Event publishing timeout')), this.config.processingTimeoutMs);
    });

    const publishPromise = this.eventPublisher.publish({
      id: event.id,
      type: event.eventType,
      aggregateId: event.aggregateId,
      data: event.eventData,
      occurredAt: event.createdAt
    });

    await Promise.race([publishPromise, timeoutPromise]);
  }

  // 🔒 HANDLE FAILED EVENT WITH RETRY STRATEGY
  private async handleFailedEvent(event: OutboxEvent, error: Error): Promise<void> {
    const retryCount = event.retryCount + 1;
    
    if (retryCount >= this.config.maxRetries) {
      // Mark as permanently failed
      await this.markEventAsFailed(event.id);
      console.error(`💀 Event permanently failed: ${event.eventType} (${event.id})`);
      
      // Send alert for manual intervention
      await this.sendFailureAlert(event, error);
      return;
    }

    // Calculate next retry time with exponential backoff
    const nextRetryAt = new Date(Date.now() + (this.config.retryDelayMs * Math.pow(2, retryCount)));
    
    await this.markEventForRetry(event.id, retryCount, nextRetryAt);
    console.log(`🔄 Event scheduled for retry: ${event.eventType} (${event.id}) - Attempt ${retryCount + 1}`);
  }

  // 🔒 DATABASE OPERATIONS (Would be implemented with actual DB queries)

  private async getPendingEvents(limit: number): Promise<OutboxEvent[]> {
    // Implementation would query:
    // SELECT * FROM outbox_events 
    // WHERE status = 'pending' OR (status = 'processing' AND processed_at < NOW() - INTERVAL '5 minutes')
    // OR (status = 'failed' AND next_retry_at <= NOW())
    // ORDER BY created_at ASC 
    // LIMIT ?
    
    // Mock implementation
    return [];
  }

  private async markEventAsProcessing(eventId: string): Promise<void> {
    // Implementation would update:
    // UPDATE outbox_events 
    // SET status = 'processing', processed_at = NOW() 
    // WHERE id = ? AND status = 'pending'
  }

  private async markEventAsCompleted(eventId: string): Promise<void> {
    // Implementation would update:
    // UPDATE outbox_events 
    // SET status = 'completed', processed_at = NOW() 
    // WHERE id = ?
  }

  private async markEventAsFailed(eventId: string): Promise<void> {
    // Implementation would update:
    // UPDATE outbox_events 
    // SET status = 'failed', processed_at = NOW() 
    // WHERE id = ?
  }

  private async markEventForRetry(
    eventId: string, 
    retryCount: number, 
    nextRetryAt: Date
  ): Promise<void> {
    // Implementation would update:
    // UPDATE outbox_events 
    // SET status = 'failed', retry_count = ?, next_retry_at = ? 
    // WHERE id = ?
  }

  // 🔒 ALERTING SYSTEM
  private async sendFailureAlert(event: OutboxEvent, error: Error): Promise<void> {
    // Implementation would send alerts to:
    // - Slack/Teams channel
    // - Email notifications
    // - Monitoring systems (DataDog, New Relic)
    
    console.error(`🚨 CRITICAL: Event processing failed permanently`, {
      eventId: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      error: error.message,
      retryCount: event.retryCount
    });
  }

  // 🔒 UTILITY METHODS
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🔒 HEALTH CHECK
  async getHealthStatus(): Promise<{
    isProcessing: boolean;
    pendingEvents: number;
    failedEvents: number;
    oldestPendingEvent?: Date;
  }> {
    // Implementation would query outbox_events table for statistics
    return {
      isProcessing: this.isProcessing,
      pendingEvents: 0,
      failedEvents: 0,
      oldestPendingEvent: undefined
    };
  }

  // 🔒 MANUAL REPROCESSING
  async reprocessFailedEvents(eventIds?: string[]): Promise<void> {
    if (eventIds) {
      // Reprocess specific events
      for (const eventId of eventIds) {
        await this.markEventForRetry(eventId, 0, new Date());
      }
    } else {
      // Reprocess all failed events
      // Implementation would update all failed events to pending
    }
    
    console.log(`🔄 Scheduled ${eventIds?.length || 'all'} failed events for reprocessing`);
  }
}
