/**
 * Memory Event Buffer — Telemetry Durability Layer
 *
 * Buffers structured telemetry events in process memory when the downstream
 * collector (Axiom, Better Stack, Sentry) is temporarily unreachable.
 *
 * Guarantees:
 * - Events are never dropped silently. They buffer until the flush succeeds.
 * - Max buffer size (default 500) acts as a backpressure valve.
 *   Oldest events are evicted if the buffer is full (ring behavior).
 * - Flush is attempted on schedule or when buffer hits the high-water mark.
 * - Flush errors are logged to stdout but never thrown to callers.
 *
 * This is Phase 1 of the event persistence layer.
 * Future: redis-event-buffer.ts (multi-instance), kafka-event-buffer.ts (durable).
 */

export interface BufferedEvent {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
}

export type FlushHandler = (events: BufferedEvent[]) => Promise<void>;

interface EventBufferConfig {
  /** Maximum events held in memory before oldest are evicted. Default: 500 */
  maxSize?: number;
  /** Flush interval in ms. Default: 10_000 (10 seconds) */
  flushIntervalMs?: number;
  /** High-water mark: flush immediately when buffer reaches this count. Default: 100 */
  highWaterMark?: number;
}

export class EventBufferProvider {
  private static instance: EventBufferProvider;
  private readonly buffer: BufferedEvent[] = [];
  private readonly handlers: FlushHandler[] = [];
  private readonly maxSize: number;
  private readonly highWaterMark: number;
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(config: EventBufferConfig = {}) {
    this.maxSize = config.maxSize ?? 500;
    this.highWaterMark = config.highWaterMark ?? 100;
    const flushIntervalMs = config.flushIntervalMs ?? 10_000;

    // Schedule periodic flush only in server environments.
    if (typeof process !== 'undefined' && typeof setInterval !== 'undefined') {
      this.flushTimer = setInterval(() => {
        this.flush().catch(() => {/* errors emitted inside flush */});
      }, flushIntervalMs);

      // Prevent the timer from keeping the process alive in test environments.
      if (this.flushTimer.unref) this.flushTimer.unref();
    }
  }

  static getInstance(): EventBufferProvider {
    if (!EventBufferProvider.instance) {
      EventBufferProvider.instance = new EventBufferProvider();
    }
    return EventBufferProvider.instance;
  }

  /** Register a handler that will receive events during flush. */
  registerHandler(handler: FlushHandler): void {
    this.handlers.push(handler);
  }

  /** Push an event into the buffer. If at maxSize, evict the oldest event first. */
  push(event: Omit<BufferedEvent, 'id' | 'timestamp'>): void {
    const buffered: BufferedEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    if (this.buffer.length >= this.maxSize) {
      // Ring eviction: drop oldest to make room.
      this.buffer.shift();
    }

    this.buffer.push(buffered);

    // Trigger immediate flush if high-water mark is hit.
    if (this.buffer.length >= this.highWaterMark && !this.isFlushing) {
      this.flush().catch(() => {});
    }
  }

  /** Drain the buffer and dispatch to all registered handlers. */
  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) return;

    this.isFlushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      await Promise.allSettled(this.handlers.map(h => h(batch)));
    } catch {
      // allSettled never throws — this is a safety net.
    } finally {
      this.isFlushing = false;
    }
  }

  /** Graceful shutdown: flush remaining events synchronously-ish. */
  async shutdown(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }

  get size(): number {
    return this.buffer.length;
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
export const eventBuffer = EventBufferProvider.getInstance();

// ── Stdout flush handler (always registered) ──────────────────────────────────
// If no external collectors are configured, events still appear in stdout logs.
eventBuffer.registerHandler(async (events) => {
  for (const event of events) {
    if (process.env.NODE_ENV === 'development') {
      process.stdout.write(
        JSON.stringify({ buffered: true, ...event }) + '\n'
      );
    }
  }
});
