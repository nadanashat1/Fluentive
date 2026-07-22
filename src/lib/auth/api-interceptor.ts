/**
 * API Interceptor for Auth
 * Handles 401 responses with automatic token refresh
 * Eliminates need for React-side auth effects
 */

import { sessionManager } from './session-manager-v2';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  // Enhanced fetch with automatic token refresh
  async fetch(input: RequestInfo | URL, options: FetchOptions = {}): Promise<Response> {
    const { skipAuth = false, retryCount = 0, ...fetchOptions } = options;

    // Skip auth for auth endpoints and explicit skip
    if (skipAuth || this.isAuthEndpoint(input)) {
      return fetch(input, fetchOptions);
    }

    // Try the request first
    let response = await fetch(input, fetchOptions);

    // If 401 and we haven't retried yet, attempt refresh
    if (response.status === 401 && retryCount === 0 && sessionManager.isAuthenticated()) {
      try {
        await this.refreshWithDeduplication();
        // Retry the original request with new tokens
        response = await this.fetch(input, { ...fetchOptions, retryCount: 1 });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, let the original 401 response propagate
        // The session manager will handle logout
      }
    }

    return response;
  }

  // Prevent multiple simultaneous refresh attempts
  private async refreshWithDeduplication(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = sessionManager.refreshSession();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Check if URL is an auth endpoint (skip refresh for these)
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

  // Create a wrapper for the global fetch (optional)
  installGlobalFetch(): void {
    const originalFetch = window.fetch;
    const interceptor = this;

    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      return interceptor.fetch(input, init);
    };
  }

  // Restore original fetch (for testing/cleanup)
  uninstallGlobalFetch(): void {
    // Implementation depends on how you store original fetch
    // This is optional and mainly for testing
  }
}

export const apiInterceptor = ApiInterceptor.getInstance();

// Convenience function for components
export const authenticatedFetch = (url: RequestInfo, options?: FetchOptions) => {
  return apiInterceptor.fetch(url, options);
};
