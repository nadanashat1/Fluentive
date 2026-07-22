// 🚀 Enterprise Auth Gateway - Zero Missing Auth System
// Global API client with automatic auth injection and recovery

interface AuthGatewayConfig {
  baseURL?: string;
  timeout: number;
  retryAttempts: number;
  autoRefresh: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  isRefreshing: boolean;
  lastActivity: number;
}

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  skipRetry?: boolean;
  priority?: 'high' | 'low' | 'auto';
}

class EnterpriseAuthGateway {
  private config: AuthGatewayConfig;
  private authState: AuthState;
  private refreshPromise: Promise<boolean> | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(config: Partial<AuthGatewayConfig> = {}) {
    this.config = {
      baseURL: '',
      timeout: 15000,
      retryAttempts: 2,
      autoRefresh: true,
      ...config
    };

    this.authState = {
      accessToken: null,
      refreshToken: null,
      user: null,
      isRefreshing: false,
      lastActivity: Date.now()
    };

    this.initializeAuthState();
  }

  // ✅ CRITICAL: Initialize auth state from storage
  private initializeAuthState(): void {
    if (typeof window !== 'undefined') {
      this.authState.accessToken = localStorage.getItem('accessToken');
      this.authState.refreshToken = localStorage.getItem('refreshToken');
      
      try {
        this.authState.user = JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
        this.authState.user = null;
      }
    }
  }

  // ✅ CRITICAL: Get current auth state
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  // ✅ CRITICAL: Update auth state
  public updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates, lastActivity: Date.now() };
    
    if (typeof window !== 'undefined') {
      if (updates.accessToken !== undefined) {
        if (updates.accessToken) {
          localStorage.setItem('accessToken', updates.accessToken);
        } else {
          localStorage.removeItem('accessToken');
        }
      }
      
      if (updates.refreshToken !== undefined) {
        if (updates.refreshToken) {
          localStorage.setItem('refreshToken', updates.refreshToken);
        } else {
          localStorage.removeItem('refreshToken');
        }
      }
      
      if (updates.user !== undefined) {
        if (updates.user) {
          localStorage.setItem('user', JSON.stringify(updates.user));
        } else {
          localStorage.removeItem('user');
        }
      }
    }
  }

  // ✅ CRITICAL: Check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Invalid token
    }
  }

  // ✅ CRITICAL: Silent token refresh
  private async refreshTokens(): Promise<boolean> {
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.authState.refreshToken;
        if (!refreshToken) {
          return false;
        }

        console.log('[AuthGateway] Refreshing tokens...');
        
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': document.cookie || '',
          },
          credentials: 'include',
          body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
          throw new Error(`Refresh failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.tokens) {
          this.updateAuthState({
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            user: data.user
          });
          
          console.log('[AuthGateway] Tokens refreshed successfully');
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('[AuthGateway] Token refresh failed:', error);
        this.updateAuthState({
          accessToken: null,
          refreshToken: null,
          user: null
        });
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return await this.refreshPromise;
  }

  // ✅ CRITICAL: Prepare request with auth headers
  private prepareRequest(url: string, config: RequestConfig = {}): RequestInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(config.headers as HeadersInit || {}),
    };

    // ✅ CRITICAL: Add auth headers
    if (!config.skipAuth) {
      const token = this.authState.accessToken;
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      
      // Always include cookies for web app
      if (typeof window !== 'undefined') {
        (headers as Record<string, string>)['Cookie'] = document.cookie;
      }
    }

    // ✅ CRITICAL: Add tracing headers
    (headers as Record<string, string>)['X-Request-ID'] = this.generateRequestId();
    (headers as Record<string, string>)['X-Request-Timestamp'] = Date.now().toString();
    (headers as Record<string, string>)['X-Request-Priority'] = config.priority || 'auto';

    return {
      ...config,
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(this.config.timeout)
    };
  }

  // ✅ CRITICAL: Generate unique request ID
  private generateRequestId(): string {
    return `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ✅ CRITICAL: Request deduplication
  private deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // ✅ CRITICAL: Enhanced fetch with auth and retry
  public async fetch<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
    const requestKey = `${config.method || 'GET'}:${url}:${JSON.stringify(config.body || '')}`;
    
    return this.deduplicateRequest(requestKey, async () => {
      let attempt = 0;
      const maxAttempts = config.skipRetry ? 1 : this.config.retryAttempts + 1;

      while (attempt < maxAttempts) {
        try {
          // ✅ CRITICAL: Check token expiration before request
          if (!config.skipAuth && this.authState.accessToken && this.isTokenExpired(this.authState.accessToken)) {
            if (this.config.autoRefresh) {
              const refreshed = await this.refreshTokens();
              if (!refreshed) {
                throw new Error('Authentication expired and refresh failed');
              }
            }
          }

          const requestConfig = this.prepareRequest(url, config);
          
          console.log(`[AuthGateway] Request ${attempt + 1}/${maxAttempts}:`, {
            url,
            method: config.method || 'GET',
            hasAuth: !!(requestConfig.headers as Record<string, string>)['Authorization'],
            requestId: (requestConfig.headers as Record<string, string>)['X-Request-ID']
          });

          const response = await fetch(url, requestConfig);

          // ✅ CRITICAL: Handle 401 with auto-refresh
          if (response.status === 401 && !config.skipAuth && this.config.autoRefresh && attempt === 0) {
            console.log('[AuthGateway] Got 401, attempting refresh...');
            const refreshed = await this.refreshTokens();
            if (refreshed) {
              attempt++;
              continue; // Retry with new token
            }
          }

          // ✅ CRITICAL: Handle other errors
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          console.log(`[AuthGateway] Request successful:`, {
            url,
            status: response.status,
            requestId: (requestConfig.headers as Record<string, string>)['X-Request-ID']
          });

          return data;

        } catch (error) {
          console.error(`[AuthGateway] Request attempt ${attempt + 1} failed:`, error);
          
          if (attempt === maxAttempts - 1) {
            throw error;
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          attempt++;
        }
      }

      throw new Error('Max retry attempts exceeded');
    });
  }

  // ✅ CRITICAL: Convenience methods
  public get<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(url, { ...config, method: 'GET' });
  }

  public post<T = any>(url: string, body: any, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(url, { ...config, method: 'POST', body: JSON.stringify(body) });
  }

  public put<T = any>(url: string, body: any, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(url, { ...config, method: 'PUT', body: JSON.stringify(body) });
  }

  public delete<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(url, { ...config, method: 'DELETE' });
  }

  // ✅ CRITICAL: Logout and cleanup
  public async logout(): Promise<void> {
    try {
      await this.fetch('/api/auth/logout', { method: 'POST', skipRetry: true });
    } catch (error) {
      console.warn('[AuthGateway] Logout request failed:', error);
    } finally {
      this.updateAuthState({
        accessToken: null,
        refreshToken: null,
        user: null
      });
    }
  }

  // ✅ CRITICAL: Get auth status
  public isAuthenticated(): boolean {
    return !!this.authState.accessToken && !!this.authState.user;
  }

  // ✅ CRITICAL: Get current user
  public getUser(): any | null {
    return this.authState.user;
  }
}

// ✅ CRITICAL: Global singleton instance
export const authGateway = new EnterpriseAuthGateway({
  timeout: 15000,
  retryAttempts: 2,
  autoRefresh: true
});

// ✅ CRITICAL: Export for use throughout the app
export default authGateway;
