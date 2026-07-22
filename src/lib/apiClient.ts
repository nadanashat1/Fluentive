// Production-Hardened API Client - Self-healing, observable, scalable
// Phase 3: From safe system to production-hardened system
// NOTE: Deduplication removed - React Query handles it better

import type { ZodSchema } from 'zod';
import { enhancedFetch } from './api-utils';
import { logError, generateRequestId } from './observability';

// In-flight request deduplication - ONLY for safe GET requests
// NEVER dedupe mutations as this causes data corruption
const inFlightRequests = new Map<string, Promise<any>>();

// Deduplicated request wrapper - only for GET requests
export function dedupedRequest<T>(key: string, requestFn: () => Promise<T>, isMutation: boolean = false): Promise<T> {
  // Never dedupe mutations - they must always execute
  if (isMutation) {
    return requestFn();
  }
  
  // Only dedupe GET requests for safety
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }
  
  const promise = requestFn()
    .finally(() => {
      inFlightRequests.delete(key);
    });
  
  inFlightRequests.set(key, promise);
  return promise;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown
  ) {
    super('API Error');
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: string[],
    message: string = 'Validation Error'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

type ApiClientOptions<T = any> = RequestInit & {
  schema?: ZodSchema<T>;
};

export async function apiClient<T>(
  url: string,
  options: ApiClientOptions<T> = {}
): Promise<T> {
  const { schema, ...restOptions } = options;
  
  // Generate request ID for tracing
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Create deduplication key (URL + method + body hash)
  const dedupeKey = `${restOptions.method || 'GET'}:${url}:${JSON.stringify(restOptions.body || '')}`;
  
  // Determine if this is a mutation (POST/PUT/DELETE)
  const isMutation = !(restOptions.method === 'GET' || restOptions.method === undefined);
  
  return dedupedRequest(dedupeKey, async () => {
    // Single-source cancellation: only create controller if no signal provided
    let timeoutId: NodeJS.Timeout | null = null;
    const abortController = new AbortController();
    const finalSignal = restOptions.signal || abortController.signal;
    
    // Only set timeout if we control the abort signal
    if (!restOptions.signal) {
      timeoutId = setTimeout(() => {
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
        logError(new Error('Request timeout after 15 seconds'), { 
          requestId, 
          url, 
          method: restOptions.method,
          duration: Date.now() - startTime 
        });
      }, 15000);
    }
    
    try {
      const result = await enhancedFetch<T>(url, schema, {
        ...restOptions,
        signal: finalSignal,
      });
      
      // Log successful request timing
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Request completed: ${requestId} (${Date.now() - startTime}ms)`);
      }
      
      return result;
    } catch (error) {
      // Log error with tracing context
      logError(error, { 
        requestId, 
        url, 
        method: restOptions.method,
        duration: Date.now() - startTime 
      });
      throw error;
    } finally {
      // Only clear timeout if we created it
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }, isMutation);
}

// Convenience methods - no deduplication (React Query handles it)
export const get = <T>(url: string, schema?: ZodSchema<T>) => 
  apiClient<T>(url, { schema, method: 'GET' });

export const post = <T>(url: string, body: unknown, schema?: ZodSchema<T>) => 
  apiClient<T>(url, { schema, method: 'POST', body: JSON.stringify(body) });

export const put = <T>(url: string, body: unknown, schema?: ZodSchema<T>) => 
  apiClient<T>(url, { schema, method: 'PUT', body: JSON.stringify(body) });

export const del = <T>(url: string, schema?: ZodSchema<T>) => 
  apiClient<T>(url, { schema, method: 'DELETE' });
