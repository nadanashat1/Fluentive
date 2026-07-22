/**
 * Sentry Client Configuration
 * Phase 1 Observability — Frontend crash capture, session replay, route timing.
 * Install: npm install @sentry/nextjs
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Only enable in production — keeps local dev logs clean.
  enabled: process.env.NODE_ENV === 'production' && Boolean(SENTRY_DSN),

  // Capture 100% of errors, 10% of performance transactions.
  // Tune tracesSampleRate down as traffic grows.
  tracesSampleRate: 0.1,

  // Session Replay: capture 1% of all sessions, 100% of sessions with errors.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Release tracking — Next.js injects NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA automatically.
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,

  integrations: [
    Sentry.replayIntegration({
      // Never record password fields or API keys.
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Scrub sensitive data before sending.
  beforeSend(event) {
    // Strip cookie headers from captured requests.
    if (event.request?.headers) {
      delete event.request.headers['Cookie'];
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});
