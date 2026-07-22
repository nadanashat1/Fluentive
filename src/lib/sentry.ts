// Lightweight error tracking for production
// Add Sentry DSN to env vars for full integration

const isDev = process.env.NODE_ENV === 'development';
const SENTRY_DSN = process.env.SENTRY_DSN;

export function captureException(error: Error, context?: Record<string, any>) {
  // In development, just log to console
  if (isDev) {
    console.error('[Sentry Dev]', error, context);
    return;
  }

  // In production, if Sentry is configured, send it
  if (SENTRY_DSN && typeof window !== 'undefined') {
    // @ts-ignore - Sentry would be loaded via script or SDK
    if (window.Sentry) {
      // @ts-ignore
      window.Sentry.captureException(error, { extra: context });
    }
  }

  // Always log critical errors in production (for Vercel logs)
  if (!isDev) {
    console.error('[Production Error]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (isDev) {
    console.log(`[Sentry Dev ${level}]`, message);
    return;
  }

  if (SENTRY_DSN && typeof window !== 'undefined') {
    // @ts-ignore
    if (window.Sentry) {
      // @ts-ignore
      window.Sentry.captureMessage(message, level);
    }
  }
}

// Track user actions for analytics
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (isDev) {
    console.log('[Analytics]', event, properties);
    return;
  }

  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('event', { name: event, ...properties });
  }
}

// Extend Window interface
declare global {
  interface Window {
    Sentry?: any;
    va?: (event: string, properties?: any) => void;
  }
}
