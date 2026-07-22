/**
 * Structured Stdout Logger — Fluentive Observability Layer
 *
 * Emits newline-delimited JSON to stdout.
 * Works identically on: Vercel, Docker, Kubernetes, local dev.
 *
 * No filesystem writes. No file handles.
 * This is the correct logging primitive for serverless/immutable runtimes.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  traceId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

// ── Correlation ID store (per-request, propagated via AsyncLocalStorage) ──────
// Import is lazy so this module is safe to import in both edge and node runtimes.
let _als: import('node:async_hooks').AsyncLocalStorage<{ traceId: string; correlationId?: string }> | null = null;

function getALS() {
  if (_als) return _als;
  try {
    // Only available in Node runtime, not Edge runtime.
    const { AsyncLocalStorage } = require('node:async_hooks');
    _als = new AsyncLocalStorage();
  } catch {
    // Edge runtime — trace propagation via ALS unavailable, graceful no-op.
  }
  return _als;
}

export function runWithTrace<T>(
  traceId: string,
  correlationId: string | undefined,
  fn: () => T
): T {
  const als = getALS();
  if (als) return als.run({ traceId, correlationId }, fn);
  return fn();
}

// ── Core emit ─────────────────────────────────────────────────────────────────

function emit(entry: StructuredLogEntry): void {
  const als = getALS();
  const ctx = als?.getStore();

  const line: StructuredLogEntry = {
    ...entry,
    traceId: entry.traceId ?? ctx?.traceId,
    correlationId: entry.correlationId ?? ctx?.correlationId,
  };

  // Newline-delimited JSON to stdout.
  // Log aggregators (Axiom, Better Stack, Datadog, CloudWatch) all parse NDJSON natively.
  process.stdout.write(JSON.stringify(line) + '\n');
}

// ── Logger class ──────────────────────────────────────────────────────────────

export class Logger {
  private static instance: Logger;
  private readonly service: string;
  private readonly parentTraceId?: string;

  private constructor(service: string, traceId?: string) {
    this.service = service;
    this.parentTraceId = traceId;
  }

  static getInstance(service = 'app'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(service);
    }
    return Logger.instance;
  }

  /** Create a child logger scoped to a specific service name with shared trace context. */
  child(service: string): Logger {
    return new Logger(service, this.parentTraceId);
  }

  private write(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    emit({
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      traceId: this.parentTraceId,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  }

  debug(service: string, message: string, metadata?: Record<string, unknown>): void {
    // Only emit debug in non-production to avoid log volume inflation.
    if (process.env.NODE_ENV === 'production') return;
    this.write('DEBUG', `[${service}] ${message}`, metadata);
  }

  info(service: string, message: string, metadata?: Record<string, unknown>): void {
    this.write('INFO', `[${service}] ${message}`, metadata);
  }

  warn(service: string, message: string, metadata?: Record<string, unknown>): void {
    this.write('WARN', `[${service}] ${message}`, metadata);
  }

  error(service: string, message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.write('ERROR', `[${service}] ${message}`, {
      ...metadata,
      ...(error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            },
          }
        : {}),
    });
  }

  fatal(service: string, message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.write('FATAL', `[${service}] ${message}`, {
      ...metadata,
      ...(error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : {}),
    });
  }
}

// ── Singleton exports ─────────────────────────────────────────────────────────

export const logger = Logger.getInstance('fluentive');

// Service-scoped child loggers — zero overhead, same stdout stream.
export const dbLogger = logger.child('database');
export const apiLogger = logger.child('api');
export const cacheLogger = logger.child('cache');
export const authLogger = logger.child('auth');
export const aiLogger = logger.child('ai');
