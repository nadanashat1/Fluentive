// Observability Layer - Production-grade error tracking and logging
// Integrates with error reporting services (Sentry, LogRocket, etc.)

interface ErrorContext {
  url?: string;
  method?: string;
  status?: number;
  userId?: string;
  timestamp: string;
  userAgent: string;
  stack?: string;
  requestId?: string;
  duration?: number;
  operation?: string;
  email?: string;
  name?: string;
  id?: string;
  data?: any;
  filters?: any;
}

// Global error tracking
const errorQueue: Array<{ error: unknown; context: ErrorContext }> = [];
let isInitialized = false;

// Initialize observability service
export function initObservability() {
  if (isInitialized || typeof window === 'undefined') return;
  
  // Initialize error reporting service (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Initialize Sentry
    // Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
  }
  
  isInitialized = true;
}

// Generate unique request ID for tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Log errors with context
export function logError(error: unknown, context?: Partial<ErrorContext>) {
  const errorContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    requestId: context?.requestId || generateRequestId(),
    ...context,
  };

  // Extract error details
  if (error instanceof Error) {
    errorContext.stack = error.stack;
    if (!errorContext.url) errorContext.url = window.location?.href;
  }

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔥 Error:', error, errorContext);
    return;
  }

  // Queue for error reporting service
  errorQueue.push({ error, context: errorContext });

  // Send to error reporting service
  sendToErrorService(error, errorContext);
}

// Send to external error service
async function sendToErrorService(error: unknown, context: ErrorContext) {
  try {
    // TODO: Send to Sentry
    // Sentry.captureException(error, { contexts: { custom: context } });
    
    // Fallback: Send to custom endpoint
    if (process.env.NEXT_PUBLIC_ERROR_ENDPOINT) {
      await fetch(process.env.NEXT_PUBLIC_ERROR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          context,
          level: 'error',
        }),
      });
    }
  } catch (e) {
    console.error('Failed to send error to service:', e);
  }
}

// Log user actions for analytics
export function logAction(action: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 Action:', action, data);
    return;
  }

  // TODO: Send to analytics service
  // analytics.track(action, data);
}

// Log performance metrics
export function logPerformance(metric: string, value: number, tags?: Record<string, string>) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚡ Performance:', metric, value, tags);
    return;
  }

  // TODO: Send to performance monitoring
  // Sentry.metrics.increment(metric, 1, tags);
}

// Initialize on import
initObservability();
