import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  organizationId?: string;
  userId?: string;
  route: string;
  method: string;
  startTime: number;
  duration?: number;
  cacheStatus?: 'HIT' | 'MISS' | 'BYPASS' | 'STALE';
  runtime: 'edge' | 'nodejs';
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Execute a callback within a request context.
 * Useful in middleware or the root API handler.
 */
export function runWithContext<T>(context: RequestContext, callback: () => T): T {
  return asyncLocalStorage.run(context, callback);
}

/**
 * Get the current request context.
 * Returns undefined if called outside a context.
 */
export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Update the current request context (e.g. setting duration at the end).
 */
export function updateContext(updates: Partial<RequestContext>): void {
  const context = getContext();
  if (context) {
    Object.assign(context, updates);
  }
}
