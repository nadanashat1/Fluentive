import { AuthError } from '@/lib/errors/AuthError';
import { logger as baseLogger } from '@/lib/observability/logger';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  level: LogLevel;
  message: string;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  endpoint?: string;
  duration?: number;
  status?: number;
}

interface LogContext {
  request?: Request;
  userId?: string;
  endpoint?: string;
  duration?: number;
  status?: number;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  async log(entry: LogEntry): Promise<void> {
    const level = entry.level;
    const message = entry.message;
    const metadata: Record<string, any> = {
      ...entry.metadata,
      userId: entry.userId,
      endpoint: entry.endpoint,
      duration: entry.duration,
      status: entry.status,
    };

    if (entry.correlationId) {
      metadata.correlationId = entry.correlationId;
    }

    switch (level) {
      case 'DEBUG':
        baseLogger.debug('server', message, metadata);
        break;
      case 'WARN':
        baseLogger.warn('server', message, metadata);
        break;
      case 'ERROR':
        baseLogger.error('server', message, undefined, metadata);
        break;
      case 'FATAL':
        baseLogger.fatal('server', message, undefined, metadata);
        break;
      case 'INFO':
      default:
        baseLogger.info('server', message, metadata);
        break;
    }
  }

  async debug(message: string, context?: LogContext): Promise<void> {
    await this.log({
      level: 'DEBUG',
      message,
      userId: context?.userId,
      metadata: this.buildMetadata(context),
      endpoint: context?.endpoint,
      duration: context?.duration,
      status: context?.status,
    });
  }

  async info(message: string, context?: LogContext): Promise<void> {
    await this.log({
      level: 'INFO',
      message,
      userId: context?.userId,
      metadata: this.buildMetadata(context),
      endpoint: context?.endpoint,
      duration: context?.duration,
      status: context?.status,
    });
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    await this.log({
      level: 'WARN',
      message,
      userId: context?.userId,
      metadata: this.buildMetadata(context),
      endpoint: context?.endpoint,
      duration: context?.duration,
      status: context?.status,
    });
  }

  async error(message: string, context?: LogContext): Promise<void> {
    await this.log({
      level: 'ERROR',
      message,
      userId: context?.userId,
      metadata: this.buildMetadata(context),
      endpoint: context?.endpoint,
      duration: context?.duration,
      status: context?.status,
    });
  }

  async fatal(message: string, context?: LogContext): Promise<void> {
    await this.log({
      level: 'FATAL',
      message,
      userId: context?.userId,
      metadata: this.buildMetadata(context),
      endpoint: context?.endpoint,
      duration: context?.duration,
      status: context?.status,
    });
  }

  private buildMetadata(context?: LogContext): Record<string, any> {
    const metadata: Record<string, any> = { ...context?.metadata };

    if (context?.request) {
      metadata.userAgent = context.request.headers.get('user-agent');
      metadata.ip = this.getClientIP(context.request);
    }

    if (context?.duration) {
      metadata.duration = context.duration;
    }

    if (context?.status) {
      metadata.status = context.status;
    }

    if (context?.correlationId) {
      metadata.correlationId = context.correlationId;
    }

    return metadata;
  }

  private getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (real) {
      return real;
    }
    
    return 'unknown';
  }

  // Auth-specific logging
  async logAuthEvent(event: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.info(`Auth: ${event}`, {
      userId,
      metadata: { ...metadata, category: 'auth' },
    });
  }

  async logAuthError(error: Error, userId?: string, metadata?: Record<string, any>): Promise<void> {
    const level = AuthError.isAuthError(error) ? 'WARN' : 'ERROR';
    
    await this.log({
      level,
      message: `Auth Error: ${error.message}`,
      userId,
      metadata: {
        ...metadata,
        category: 'auth',
        errorType: error.constructor.name,
        errorCode: AuthError.isAuthError(error) ? error.code : 'UNKNOWN',
      },
    });
  }

  // API performance logging
  async logAPIPerformance(endpoint: string, duration: number, status: number, userId?: string): Promise<void> {
    const level = status >= 400 ? 'WARN' : 'INFO';
    
    await this.log({
      level,
      message: `API: ${endpoint} - ${status} (${duration}ms)`,
      userId,
      endpoint,
      duration,
      status,
      metadata: {
        category: 'api',
        fast: duration < 100,
        slow: duration > 1000,
      },
    });
  }
}

export const logger = Logger.getInstance();
