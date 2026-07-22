import {
  CacheProvider,
  CacheStats,
  RateLimitProvider,
  RateLimitResult,
  RateLimitStats,
  CircuitStateProvider,
  CircuitStateEntry,
  CircuitState,
  EventProvider,
  SystemEvent
} from './types';

// ─── Memory Cache Provider ──────────────────────────────────────────────────

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    // Simple glob-to-regex conversion for memory provider
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async stats(): Promise<CacheStats> {
    const totalRequests = this.hits + this.misses;
    return {
      provider: 'memory',
      entries: this.store.size,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0
    };
  }
}

// ─── Memory Rate Limit Provider ─────────────────────────────────────────────

interface RateLimitWindow {
  count: number;
  resetAtMs: number;
}

export class MemoryRateLimitProvider implements RateLimitProvider {
  private store = new Map<string, RateLimitWindow>();
  private totalChecks = 0;

  async check(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    this.totalChecks++;
    const now = Date.now();
    let window = this.store.get(identifier);

    if (!window || now > window.resetAtMs) {
      window = { count: 0, resetAtMs: now + windowMs };
      this.store.set(identifier, window);
    }

    window.count++;

    const allowed = window.count <= limit;
    const remaining = Math.max(0, limit - window.count);
    const retryAfterMs = allowed ? 0 : window.resetAtMs - now;

    return {
      allowed,
      remaining,
      resetAtMs: window.resetAtMs,
      retryAfterMs
    };
  }

  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier);
  }

  async stats(): Promise<RateLimitStats> {
    // Cleanup expired windows before counting
    const now = Date.now();
    for (const [key, window] of this.store.entries()) {
      if (now > window.resetAtMs) {
        this.store.delete(key);
      }
    }

    return {
      provider: 'memory',
      activeWindows: this.store.size,
      totalEntries: this.totalChecks
    };
  }
}

// ─── Memory Circuit State Provider ──────────────────────────────────────────

export class MemoryCircuitStateProvider implements CircuitStateProvider {
  private store = new Map<string, CircuitStateEntry>();

  async getState(circuitId: string): Promise<CircuitStateEntry> {
    let entry = this.store.get(circuitId);
    if (!entry) {
      entry = {
        circuitId,
        state: 'CLOSED',
        failures: 0,
        lastFailureAt: 0,
        lastSuccessAt: 0,
        nextRetryAt: 0
      };
      this.store.set(circuitId, entry);
    }
    
    // Auto-transition OPEN -> HALF_OPEN if retry time has passed
    if (entry.state === 'OPEN' && Date.now() >= entry.nextRetryAt) {
      entry.state = 'HALF_OPEN';
      this.store.set(circuitId, entry);
    }
    
    return { ...entry }; // Return a copy
  }

  async recordFailure(circuitId: string): Promise<CircuitStateEntry> {
    const entry = await this.getState(circuitId);
    
    entry.failures++;
    entry.lastFailureAt = Date.now();
    
    // Default config logic handled at higher level, but we record the raw failure here
    this.store.set(circuitId, entry);
    return { ...entry };
  }

  async recordSuccess(circuitId: string): Promise<CircuitStateEntry> {
    const entry = await this.getState(circuitId);
    
    entry.state = 'CLOSED';
    entry.failures = 0;
    entry.lastSuccessAt = Date.now();
    
    this.store.set(circuitId, entry);
    return { ...entry };
  }

  async setState(circuitId: string, state: CircuitState, nextRetryAt: number = 0): Promise<void> {
    const entry = await this.getState(circuitId);
    entry.state = state;
    if (state === 'OPEN') {
      entry.nextRetryAt = nextRetryAt;
    }
    this.store.set(circuitId, entry);
  }

  async listCircuits(): Promise<CircuitStateEntry[]> {
    return Array.from(this.store.values()).map(entry => ({ ...entry }));
  }
}

// ─── Memory Event Provider ──────────────────────────────────────────────────

export class MemoryEventProvider implements EventProvider {
  private subscribers = new Map<string, Set<(event: SystemEvent) => void>>();
  private globalSubscribers = new Set<(event: SystemEvent) => void>();
  private history: SystemEvent[] = [];
  private readonly MAX_HISTORY = 1000;

  emit(event: SystemEvent): void {
    // Add to history
    this.history.unshift(event);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }

    // Process asynchronously to avoid blocking the caller
    process.nextTick(() => {
      // Notify type-specific subscribers
      const typeSubs = this.subscribers.get(event.type);
      if (typeSubs) {
        for (const handler of typeSubs) {
          try { handler(event); } catch (e) { console.error('Event handler error:', e); }
        }
      }

      // Notify global subscribers
      for (const handler of this.globalSubscribers) {
        try { handler(event); } catch (e) { console.error('Global event handler error:', e); }
      }
    });
  }

  subscribe(eventType: string, handler: (event: SystemEvent) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);
    
    return () => {
      const subs = this.subscribers.get(eventType);
      if (subs) {
        subs.delete(handler);
        if (subs.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  subscribeAll(handler: (event: SystemEvent) => void): () => void {
    this.globalSubscribers.add(handler);
    return () => {
      this.globalSubscribers.delete(handler);
    };
  }

  recentEvents(limit: number = 100): SystemEvent[] {
    return this.history.slice(0, limit);
  }
}
