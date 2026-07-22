// === GLOBAL AUTHENTICATED API CLIENT ===
// Centralized fetch wrapper with automatic token refresh and retry logic

import { authKernel, AuthState } from './auth/auth-kernel';
import { HttpError } from './api-client';

// Request cache to prevent duplicate in-flight requests
const requestCache = new Map<string, Promise<Response>>();
const CACHE_TTL = 5000; // 5 seconds

// Clean up expired cache entries
function cleanupCache() {
  const now = Date.now();
  for (const [key, promise] of requestCache.entries()) {
    // Simple cleanup - in production, you might want timestamp tracking
    if (Math.random() < 0.1) { // 10% chance to cleanup on each call
      requestCache.delete(key);
    }
  }
}

/**
 * Global fetch wrapper with automatic token refresh
 * Handles 401 errors transparently by refreshing tokens and retrying
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Clean up cache occasionally
  cleanupCache();
  
  // Create cache key
  const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
  
  // Check if request is already in flight
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  // Create request promise
  const requestPromise = executeAuthRequest(url, options);
  
  // Cache the promise
  requestCache.set(cacheKey, requestPromise);
  
  // Remove from cache when complete
  requestPromise.finally(() => {
    requestCache.delete(cacheKey);
  });

  return requestPromise;
}

/**
 * Execute authenticated request with retry logic
 */
async function executeAuthRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const currentVersion = authKernel.getVersion();
  
  // Ensure credentials are included
  const fetchOptions = {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // First attempt
  let response = await fetch(url, fetchOptions);

  // Handle 401 - attempt token refresh once
  if (response.status === 401) {
    // Don't retry if already unauthenticated or if this is an auth endpoint
    const state = authKernel.getState();
    if (state.status === AuthState.ANONYMOUS || state.status === AuthState.EXPIRED) {
      return response;
    }

    if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/logout')) {
      return response;
    }

    console.log('[API] Token expired, attempting refresh...');
    
    try {
      // Attempt to refresh token
      await authKernel.refreshToken();
      
      // Check if session version changed during refresh (race condition guard)
      if (authKernel.getVersion() !== currentVersion) {
        console.warn('[API] Session version changed during refresh, aborting request');
        throw new Error('Session changed during refresh');
      }
      
      // Retry the original request with new token
      console.log('[API] Retrying request with refreshed token...');
      response = await fetch(url, fetchOptions);
      
    } catch (refreshError) {
      console.error('[API] Token refresh failed:', refreshError);
      
      // If refresh fails, clear session and let the original 401 propagate
      await authKernel.logout();
      
      // Redirect to login if we're in a browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return response;
    }
  }

  return response;
}

/**
 * Typed API client for common operations
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: 'GET' });
  
  if (!response.ok) {
    throw new HttpError(response.status, `GET ${url} failed`);
  }
  
  return response.json();
}

export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new HttpError(response.status, `POST ${url} failed`);
  }
  
  return response.json();
}

export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  const response = await apiFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new HttpError(response.status, `PUT ${url} failed`);
  }
  
  return response.json();
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: 'DELETE' });
  
  if (!response.ok) {
    throw new HttpError(response.status, `DELETE ${url} failed`);
  }
  
  return response.json();
}

/**
 * Safe fetch that returns null on error instead of throwing
 */
export async function safeApiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const response = await apiFetch(url, options);
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] Safe fetch failed:', error);
    return null;
  }
}

/**
 * Hook for components to check if they should delay API calls
 */
export function shouldDelayApiCalls(): boolean {
  const state = authKernel.getState();
  return state.status === AuthState.HYDRATING || state.status === AuthState.ANONYMOUS;
}

/**
 * Utility to wait for authentication before making API calls
 */
export async function waitForAuth(): Promise<void> {
  return new Promise((resolve) => {
    const checkAuth = () => {
      const state = authKernel.getState();
      if (state.status === AuthState.AUTHENTICATED || state.status === AuthState.ANONYMOUS) {
        resolve();
      } else {
        // Subscribe to auth state changes
        const unsubscribe = authKernel.subscribe(() => {
          const newState = authKernel.getState();
          if (newState.status === AuthState.AUTHENTICATED || newState.status === AuthState.ANONYMOUS) {
            unsubscribe();
            resolve();
          }
        });
      }
    };
    
    checkAuth();
  });
}
