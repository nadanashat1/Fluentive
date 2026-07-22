/**
 * Production-Grade API Interceptor
 * - No global fetch patching
 * - Request identity-based retry locking
 * - Request coalescing
 * - Stale response rejection
 */

import { sessionManager } from './session-manager-v2';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  sessionVersion?: number;
}

interface InflightRequest {
  promise: Promise<Response>;
  timestamp: number;
}

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private retriedRequests = new WeakSet<Request>();
  private inflightRequests = new Map<string, InflightRequest>();
  private readonly COALESCING_TTL = 5000; // 5 seconds

  static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  // === CONTROLLED API CLIENT ===
  // Export this as the single source for all API calls
  async fetch(input: RequestInfo | URL, options: FetchOptions = {}): Promise<Response> {
    const { skipAuth = false, sessionVersion, ...fetchOptions } = options;

    // Skip auth for auth endpoints and explicit skip
    if (skipAuth || this.isAuthEndpoint(input)) {
      return fetch(input, fetchOptions);
    }

    // === REQUEST COALESCING ===
    const requestKey = this.getRequestKey(input, fetchOptions);
    const existingRequest = this.inflightRequests.get(requestKey);
    
    if (existingRequest && Date.now() - existingRequest.timestamp < this.COALESCING_TTL) {
      return existingRequest.promise;
    }

    // Create new request
    const requestPromise = this.executeRequest(input, fetchOptions, sessionVersion);
    
    // Store for coalescing
    this.inflightRequests.set(requestKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    // Cleanup after request completes
    requestPromise.finally(() => {
      this.inflightRequests.delete(requestKey);
    });

    return requestPromise;
  }

  private async executeRequest(
    input: RequestInfo | URL, 
    options: RequestInit,
    sessionVersion?: number
  ): Promise<Response> {
    const currentSessionVersion = sessionManager.getSessionVersion();
    
    // Try the request first
    let response = await fetch(input, options);

    // === 401 HANDLING WITH REQUEST IDENTITY LOCKING ===
    if (response.status === 401 && sessionManager.isAuthenticated()) {
      const request = input instanceof Request ? input : new Request(input, options);
      
      // Only retry if this specific request hasn't been retried before
      if (!this.retriedRequests.has(request)) {
        this.retriedRequests.add(request);
        
        try {
          await sessionManager.refreshSession();
          
          // === STALE RESPONSE REJECTION ===
          // If session version changed during refresh, abort this request
          if (sessionVersion && sessionVersion !== currentSessionVersion) {
            throw new Error('Session version changed during request');
          }
          
          // Retry the original request with new tokens
          response = await fetch(input, options);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Refresh failed, let the original 401 response propagate
          // The session manager will handle logout
        }
      }
    }

    return response;
  }

  // === REQUEST IDENTITY HELPERS ===
  private getRequestKey(input: RequestInfo | URL, options: RequestInit): string {
    const url = typeof input === 'string' ? input : input.toString();
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    
    return `${method}:${url}:${body}`;
  }

  // === AUTH ENDPOINT DETECTION ===
  private isAuthEndpoint(input: RequestInfo | URL): boolean {
    const authEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout',
      '/api/auth/refresh',
      '/api/auth/me'
    ];

    const url = typeof input === 'string' ? input : input.toString();
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }

  // === UTILITY METHODS ===
  clearInflightRequests(): void {
    this.inflightRequests.clear();
  }

  getInflightRequestCount(): number {
    return this.inflightRequests.size;
  }
}

// === EXPORT CONTROLLED CLIENT ===
export const apiInterceptor = ApiInterceptor.getInstance();

// Primary API client - use this instead of fetch
export const apiFetch = (input: RequestInfo | URL, options?: FetchOptions) => {
  return apiInterceptor.fetch(input, options);
};

// Convenience methods
export const apiGet = (url: string, options?: Omit<FetchOptions, 'method'>) => {
  return apiFetch(url, { ...options, method: 'GET' });
};

export const apiPost = (url: string, data?: any, options?: Omit<FetchOptions, 'method' | 'body'>) => {
  return apiFetch(url, { 
    ...options, 
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
};

export const apiPut = (url: string, data?: any, options?: Omit<FetchOptions, 'method' | 'body'>) => {
  return apiFetch(url, { 
    ...options, 
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
};

export const apiDelete = (url: string, options?: Omit<FetchOptions, 'method'>) => {
  return apiFetch(url, { ...options, method: 'DELETE' });
};

// === SESSION VERSION AWARE FETCH ===
export const versionedFetch = (input: RequestInfo | URL, options?: FetchOptions) => {
  const sessionVersion = sessionManager.getSessionVersion();
  return apiFetch(input, { ...options, sessionVersion });
};
