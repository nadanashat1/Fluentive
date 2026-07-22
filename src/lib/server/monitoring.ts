// Enterprise Monitoring & Observability Layer
// Provides structured logging and error tracking

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry structure
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  data?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  duration?: number;
}

// Get current log level from environment
const CURRENT_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || 'info';

// Log level priority
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Check if should log
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
}

// Generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Core logging function
function log(level: LogLevel, event: string, message: string, data?: Record<string, unknown>, meta?: { requestId?: string; userId?: string; duration?: number }): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    data,
    ...meta,
  };

  // Structured JSON logging for production
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(entry));
  } else {
    // Pretty print for development
    const color = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    }[level];

    console.log(
      `${color}[${entry.timestamp}] ${level.toUpperCase()}: ${event} - ${message}\x1b[0m`,
      data ? `\nData: ${JSON.stringify(data, null, 2)}` : '',
      meta?.requestId ? `\nRequest: ${meta.requestId}` : ''
    );
  }
}

// Export logging functions
export const logger = {
  debug: (event: string, message: string, data?: Record<string, unknown>) =>
    log('debug', event, message, data),

  info: (event: string, message: string, data?: Record<string, unknown>) =>
    log('info', event, message, data),

  warn: (event: string, message: string, data?: Record<string, unknown>) =>
    log('warn', event, message, data),

  error: (event: string, message: string, data?: Record<string, unknown>) =>
    log('error', event, message, data),

  // Performance logging
  performance: (event: string, duration: number, data?: Record<string, unknown>) =>
    log('info', event, `Completed in ${duration}ms`, data, { duration }),

  // API request logging
  apiRequest: (method: string, path: string, status: number, duration: number, userId?: string) =>
    log('info', 'api_request', `${method} ${path} - ${status}`, { status, path, method }, { userId, duration }),

  // Security events
  security: (event: string, message: string, data?: Record<string, unknown>) =>
    log('warn', `security_${event}`, message, data),
};

// Performance tracking
export class PerformanceTracker {
  private startTime: number;
  private requestId: string;

  constructor(private event: string) {
    this.startTime = Date.now();
    this.requestId = generateRequestId();
  }

  end(data?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    logger.performance(this.event, duration, { ...data, requestId: this.requestId });
  }

  getRequestId(): string {
    return this.requestId;
  }
}

// Error tracking wrapper
export function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: { event: string; userId?: string }
): Promise<T> {
  const tracker = new PerformanceTracker(context.event);

  return fn()
    .then((result) => {
      tracker.end({ userId: context.userId, success: true });
      return result;
    })
    .catch((error) => {
      tracker.end({ userId: context.userId, success: false, error: error.message });
      logger.error(context.event, error.message, {
        stack: error.stack,
        userId: context.userId,
      });
      throw error;
    });
}

// Request context for tracking
export interface RequestContext {
  requestId: string;
  userId?: string;
  path: string;
  method: string;
  startTime: number;
}

export function createRequestContext(request: Request): RequestContext {
  return {
    requestId: generateRequestId(),
    path: new URL(request.url).pathname,
    method: request.method,
    startTime: Date.now(),
  };
}

export function logRequestComplete(context: RequestContext, status: number): void {
  const duration = Date.now() - context.startTime;
  logger.apiRequest(context.method, context.path, status, duration, context.userId);
}
