// Auth interceptor for automatic token refresh and retry logic
import { AuthError } from '@/lib/errors/AuthError';

interface AuthConfig {
  baseURL?: string;
  refreshTokenEndpoint: string;
  maxRetries: number;
  retryDelay: number;
}

class AuthInterceptor {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  constructor(private config: AuthConfig) {}

  // Enhanced fetch with automatic token refresh
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const { signal } = controller;

    try {
      const response = await this.makeRequest(url, { ...options, signal });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request aborted');
      }
      throw error;
    }
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    let retryCount = 0;

    while (retryCount < this.config.maxRetries) {
      try {
        const response = await fetch(url, options);

        // If successful, return response
        if (response.ok) {
          return response;
        }

        // If 401 Unauthorized, try to refresh token
        if (response.status === 401) {
          // Prevent infinite retry loops
          if (retryCount > 1) {
            throw AuthError.sessionExpired({ source: 'interceptor', reason: 'max_retries_exceeded' });
          }

          const refreshResult = await this.handleTokenRefresh();
          
          if (refreshResult.success) {
            // Retry the original request with new token
            retryCount++;
            await this.delay(this.config.retryDelay);
            continue;
          } else {
            // Refresh failed, clear auth and redirect
            await this.handleAuthFailure();
            throw new Error('Authentication failed');
          }
        }

        // If 403 Forbidden, user doesn't have permission
        if (response.status === 403) {
          // Don't retry 403 errors - they're permission issues, not auth issues
          await this.handleForbiddenAccess();
          throw new Error('Access forbidden - insufficient permissions');
        }

        // For other errors, return response as-is
        return response;

      } catch (error) {
        retryCount++;
        
        if (retryCount >= this.config.maxRetries) {
          throw error;
        }

        await this.delay(this.config.retryDelay * retryCount);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async handleTokenRefresh(): Promise<{ success: boolean }> {
    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(this.config.refreshTokenEndpoint, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh successful, resolve queued requests
        this.failedQueue.forEach(({ resolve }) => resolve(true));
        this.failedQueue = [];
        return { success: true };
      } else {
        // Refresh failed, reject queued requests
        this.failedQueue.forEach(({ reject }) => reject(new Error('Refresh failed')));
        this.failedQueue = [];
        return { success: false };
      }
    } catch (error) {
      // Network error during refresh
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];
      return { success: false };
    } finally {
      this.isRefreshing = false;
    }
  }

  private async handleAuthFailure(): Promise<void> {
    // Clear auth state on server
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout during auth failure:', error);
    }

    // Throw specific error for UI layer to handle
    throw AuthError.sessionExpired({ source: 'interceptor' });
  }

  private async handleForbiddenAccess(): Promise<void> {
    // For 403 errors, we don't logout but we should redirect
    // This is a client-side concern - the UI should handle the redirect
    console.warn('Access forbidden - insufficient permissions');
    
    // Throw specific error for UI layer to handle
    throw AuthError.sessionExpired({ 
      source: 'interceptor', 
      reason: 'forbidden_access',
      message: 'You do not have permission to access this resource'
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const authInterceptor = new AuthInterceptor({
  refreshTokenEndpoint: '/api/auth/refresh',
  maxRetries: 3,
  retryDelay: 1000,
});

// Enhanced fetch wrapper with proper parsing contract
export async function authenticatedFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  // Get token from cookies for Authorization header
  const token = typeof window !== 'undefined' 
    ? (() => {
        // Try multiple cookie names for compatibility
        const cookieNames = ['accessToken', 'token', 'auth_token'];
        const cookies = document.cookie.split(';');
        
        console.log('[Auth Interceptor] Available cookies:', document.cookie);
        
        for (const name of cookieNames) {
          const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
          if (cookie) {
            const tokenValue = cookie.split('=')[1];
            console.log(`[Auth Interceptor] Found ${name} cookie:`, tokenValue ? tokenValue.substring(0, 20) + '...' : 'NULL');
            return tokenValue;
          }
        }
        
        console.log('[Auth Interceptor] No auth token found in cookies');
        return null;
      })()
    : null;

  // ✅ DEBUG: Log cookie presence
  const hasCookies = typeof window !== 'undefined' && document.cookie.length > 0;
  console.log(`[Auth Interceptor] Request to ${url} - Has cookies: ${hasCookies}, Token: ${token ? 'YES' : 'NO'}`);
  
  const response = await authInterceptor.fetch(url, {
    ...options,
    credentials: 'include', // Include cookies by default
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
