/**
 * Sentry Server Configuration
 * Phase 1 Observability — API exception tracking, Prisma error capture, server-side traces.
 * Install: npm install @sentry/nextjs
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production' && Boolean(SENTRY_DSN),

  // Lower sample rate on server to manage cost at scale.
  tracesSampleRate: 0.05,

  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,

  // Scrub PII before sending to Sentry.
  beforeSend(event) {
    // Remove DB connection strings from captured exceptions.
    if (event.extra?.DATABASE_URL) delete event.extra.DATABASE_URL;
    if (event.extra?.REDIS_URL) delete event.extra.REDIS_URL;

    // Sanitize request bodies containing passwords.
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      if (data.password) data.password = '[REDACTED]';
      if (data.token) data.token = '[REDACTED]';
    }

    return event;
  },
});
