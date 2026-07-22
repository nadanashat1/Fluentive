/**
 * Sentry Edge Configuration
 * Phase 1 Observability — Exception tracking in Edge functions and middleware.
 * Install: npm install @sentry/nextjs
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production' && Boolean(SENTRY_DSN),

  tracesSampleRate: 0.05,

  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,

  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['Cookie'];
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});
