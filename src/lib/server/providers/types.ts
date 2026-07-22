/**
 * ENTERPRISE PROVIDER INTERFACES v1.0
 *
 * Provider-agnostic abstractions for infrastructure services.
 * Current implementation: in-memory (single-instance safe).
 * Future swap target: Upstash Redis / ioredis (multi-instance safe).
 *
 * Switch to Redis when ANY of these become true:
 *   - multiple replicas / autoscaling
 *   - background job workers
 *   - websocket fanout
 *   - shared rate limits across instances
 *   - cross-instance circuit breakers
 */

// ─── Cache Provider ─────────────────────────────────────────────────────────

export interface CacheProvider {
  /** Retrieve a cached value. Returns null on miss. */
  get<T = unknown>(key: string): Promise<T | null>;

  /** Store a value with a TTL in seconds. */
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;

  /** Delete a single cached key. */
  delete(key: string): Promise<void>;

  /** Delete all keys matching a glob pattern (e.g. `org:abc:*`). */
  deletePattern(pattern: string): Promise<void>;

  /** Check if a key exists without deserializing. */
  has(key: string): Promise<boolean>;

  /** Diagnostic stats for monitoring endpoints. */
  stats(): Promise<CacheStats>;
}

export interface CacheStats {
  provider: 'memory' | 'redis' | 'upstash';
  entries: number;
  hitRate?: number;
  memoryBytes?: number;
}

// ─── Rate Limit Provider ────────────────────────────────────────────────────

export interface RateLimitProvider {
  /**
   * Evaluate whether a request is allowed under the sliding window.
   * @param identifier - Unique key (e.g. `ip:1.2.3.4` or `user:abc`)
   * @param limit      - Max requests in the window
   * @param windowMs   - Window duration in milliseconds
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult>;

  /** Reset the counter for a specific identifier. */
  reset(identifier: string): Promise<void>;

  /** Diagnostic stats for monitoring endpoints. */
  stats(): Promise<RateLimitStats>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
  retryAfterMs: number;
}

export interface RateLimitStats {
  provider: 'memory' | 'redis' | 'upstash';
  activeWindows: number;
  totalEntries: number;
}

// ─── Circuit State Provider ─────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitStateProvider {
  /** Get the current state for a circuit. Returns CLOSED if unknown. */
  getState(circuitId: string): Promise<CircuitStateEntry>;

  /** Record a failure. May transition CLOSED → OPEN. */
  recordFailure(circuitId: string): Promise<CircuitStateEntry>;

  /** Record a success. Transitions HALF_OPEN → CLOSED, resets counters. */
  recordSuccess(circuitId: string): Promise<CircuitStateEntry>;

  /** Force a specific state (used in recovery or admin overrides). */
  setState(circuitId: string, state: CircuitState): Promise<void>;

  /** Diagnostic: list all circuits and their states. */
  listCircuits(): Promise<CircuitStateEntry[]>;
}

export interface CircuitStateEntry {
  circuitId: string;
  state: CircuitState;
  failures: number;
  lastFailureAt: number;
  lastSuccessAt: number;
  /** When OPEN, the circuit will transition to HALF_OPEN after this timestamp. */
  nextRetryAt: number;
}

/** Configuration for a circuit breaker. */
export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit. Default: 5 */
  failureThreshold: number;
  /** Cooldown period before trying HALF_OPEN in ms. Default: 60_000 */
  cooldownMs: number;
  /** Timeout for the protected operation in ms. Default: 10_000 */
  timeoutMs: number;
}

// ─── Event Provider ─────────────────────────────────────────────────────────

export interface EventProvider {
  /** Emit a structured event. Fire-and-forget semantics. */
  emit(event: SystemEvent): void;

  /** Subscribe to events of a specific type. Returns an unsubscribe function. */
  subscribe(
    eventType: string,
    handler: (event: SystemEvent) => void
  ): () => void;

  /** Subscribe to ALL events. Returns an unsubscribe function. */
  subscribeAll(handler: (event: SystemEvent) => void): () => void;

  /** Get recent events for diagnostics (bounded buffer). */
  recentEvents(limit?: number): SystemEvent[];
}

/** A structured platform event with correlation context. */
export interface SystemEvent {
  /** Event type constant, e.g. 'AUTH_LOGIN_SUCCESS' */
  type: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Severity level */
  severity: 'info' | 'warn' | 'error' | 'critical';
  /** Correlation context from the request that triggered this event */
  context: EventContext;
  /** Event-specific payload */
  payload: Record<string, unknown>;
}

export interface EventContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  route?: string;
  method?: string;
  duration?: number;
  cacheStatus?: 'HIT' | 'MISS' | 'BYPASS' | 'STALE';
  runtime?: 'edge' | 'nodejs';
}
