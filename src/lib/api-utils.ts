// API Utilities - Production-hardened helper functions
// Retry logic, auth refresh, response normalization, deduplication

import { ZodSchema } from 'zod';
import { logApiRequest, logApiResponse, setAuthRefreshState, getAuthRefreshState } from './api-observability';

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Smart retry logic - only retry on network errors, not client errors
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Don't retry on 4xx client errors (except 408 Request Timeout, 429 Too Many Requests)
    if (response.status >= 400 && response.status < 500 && 
        response.status !== 408 && response.status !== 429) {
      return response;
    }
    
    return response;
  } catch (err) {
    if (retries === 0) throw err;
    
    // Only retry network errors, not HTTP errors
    if (err instanceof Error && 
        (err.name === 'TypeError' || err.name === 'NetworkError' || (err.message && typeof err.message === 'string' && err.message.includes('fetch')))) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries))); // Exponential backoff
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw err;
  }
}

// Single-flight refresh lock
let refreshPromise: Promise<boolean> | null = null;

// Auth token refresh logic with single-flight lock
export async function refreshAuthToken(): Promise<boolean> {
  // If refresh already in progress, wait for it to complete
  if (refreshPromise) {
    return await refreshPromise;
  }

  // Set refresh promise to prevent concurrent refreshes
  refreshPromise = (async () => {
    if (getAuthRefreshState()) {
      return false;
    }

    try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return true;
      }
    }

    return false;
    } catch (error) {
      return false;
    } finally {
      // Clear refresh promise to allow next refresh
      refreshPromise = null;
      setAuthRefreshState(false);
    }
  })();

  return await refreshPromise;
}

// Response normalization to eliminate backend chaos
export function normalizeResponse(data: any) {
  // Handle different response formats from backend
  if (data?.data) return data.data;
  if (data?.result) return data.result;
  if (data?.user) return data.user;
  if (data?.lead) return data.lead;
  if (data?.leads) return data.leads;
  if (data?.dashboard) return data.dashboard;
  if (data?.notifications) return data.notifications;
  
  return data;
}

// Request deduplication - shares full lifecycle including auth refresh
export function dedupeRequest<T>(url: string, requestFn: () => Promise<T>): Promise<T> {
  const key = url;
  
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  // Store the complete request lifecycle (including auth refresh)
  const promise = requestFn()
    .catch((err) => {
      throw err;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  
  // Fallback cleanup to prevent memory leaks in edge cases
  setTimeout(() => {
    if (pendingRequests.has(key)) {
      pendingRequests.delete(key);
    }
  }, 30000); // 30 second safety net

  return promise;
}

// Circuit breaker state - scoped per endpoint (already correct)
const circuitBreakerState = new Map<string, {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}>();

// Auth endpoints that should never be circuit-broken
const AUTH_EXCLUDED = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/time-tracking/heartbeat'
];

// Circuit breaker logic - never block auth endpoints
function shouldCircuitBreak(url: string): boolean {
  const state = circuitBreakerState.get(url);
  if (!state) return false;

  // Never break auth endpoints - they must always be available
  const isAuthEndpoint = AUTH_EXCLUDED.some(endpoint => url && typeof url === 'string' && url.includes(endpoint));
  if (isAuthEndpoint) return false;

  const now = Date.now();
  const cooldownPeriod = 60000; // 1 minute cooldown

  if (state.state === 'OPEN') {
    if (now - state.lastFailure > cooldownPeriod) {
      state.state = 'HALF_OPEN';
      return false;
    }
    return true;
  }

  return false;
}

function recordFailure(url: string) {
  const state = circuitBreakerState.get(url) || {
    failures: 0,
    lastFailure: 0,
    state: 'CLOSED' as const
  };

  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= 5) {
    state.state = 'OPEN';
  }

  circuitBreakerState.set(url, state);
}

function recordSuccess(url: string) {
  const state = circuitBreakerState.get(url);
  if (state) {
    state.failures = 0;
    state.state = 'CLOSED';
  }
}

// Enhanced fetch with all production features
export async function enhancedFetch<T>(
  url: string,
  schema?: ZodSchema<T>,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const requestStart = logApiRequest(url, options.method);
  let responseLogged = false;
  const MAX_TOTAL_TIMEOUT = 15000; // 15 seconds global timeout across all retries
  const startTime = Date.now();
  
  try {
    // Check circuit breaker
    if (shouldCircuitBreak(url)) {
      throw new Error('Service temporarily unavailable - circuit breaker OPEN');
    }

    // Check global timeout
    if (Date.now() - startTime > MAX_TOTAL_TIMEOUT) {
      throw new Error('Request timeout exceeded');
    }

    // Add timeout protection for this attempt
    const controller = new AbortController();
    const remainingTimeout = MAX_TOTAL_TIMEOUT - (Date.now() - startTime);
    const timeoutId = setTimeout(() => controller.abort(), remainingTimeout);

    // Tokens are now sent via httpOnly cookies automatically by browser
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Make request with retry and timeout
    const response = await fetchWithRetry(url, { 
      ...options, 
      headers,
      signal: controller.signal,
      credentials: 'include'
    }, 2);

    clearTimeout(timeoutId);

    // Parse response safely
    const data = await response.json().catch(() => null);

    const isAuthEndpoint =
      url && typeof url === 'string' && (
        url.includes('/api/auth/login') ||
        url.includes('/api/auth/register') ||
        url.includes('/api/auth/refresh') ||
        url.includes('/api/auth/logout'));

    // Handle auth errors with auto-refresh and retry (skip auth endpoints themselves)
    if (response.status === 401 && retryCount === 0 && !isAuthEndpoint) {
      const refreshed = await refreshAuthToken();
      
      if (refreshed) {
        // Retry original request with new token
        return enhancedFetch(url, schema, options, retryCount + 1);
      } else {
        throw new Error(data?.error || 'Authentication failed');
      }
    }

    // Log response
    logApiResponse(requestStart, response.status, !response.ok ? data : undefined);
    responseLogged = true;

    // Handle HTTP errors - only record failure after all retries complete
    if (!response.ok) {
      // Record all failures for analytics but never block auth endpoints
      const isAuthEndpoint = AUTH_EXCLUDED.some(endpoint => url && typeof url === 'string' && url.includes(endpoint));
      recordFailure(url);
      throw new Error(data?.error || `HTTP ${response.status}: Request failed`);
    }

    // Record success for circuit breaker
    recordSuccess(url);

    // Validate with Zod schema BEFORE normalizing (schemas expect full response shape)
    if (schema) {
      try {
        const validated = schema.parse(data);
        // Return validated data — caller gets the typed, schema-conformant result
        return validated;
      } catch (error) {
        if (error instanceof Error && 'issues' in error) {
          throw new Error(`Response validation failed: ${(error as any).issues.map((e: any) => e.message).join(', ')}`);
        }
        throw error;
      }
    }

    // Only normalize when no schema provided
    const normalized = normalizeResponse(data);
    return normalized as T;
  } catch (error) {
    // Record failure for circuit breaker - only after all retries exhausted
    // Don't record failures for auth endpoints - they should always be available
    const isAuthEndpoint = AUTH_EXCLUDED.some(endpoint => url && typeof url === 'string' && url.includes(endpoint));
    if (error instanceof Error && !error.message.includes('circuit breaker') && !isAuthEndpoint) {
      recordFailure(url);
    }
    
    if (!responseLogged) {
      logApiResponse(requestStart, 0, error);
    }
    throw error;
  }
}
