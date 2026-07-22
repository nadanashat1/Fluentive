// === AUTH KERNEL V2 - CLEAN ARCHITECTURE ===

import type { User, AuthState, AuthEvent, AuthKernelState } from '@/types/auth.types';

interface InflightRequest {
  promise: Promise<Response>;
  timestamp: number;
}

class AuthKernel {
  private static instance: AuthKernel;
  
  // === STABLE STATE REFERENCE ===
  private state: AuthKernelState = {
    status: 'anonymous' as AuthState,
    user: null,
    version: 0
  };
  
  // === LISTENERS ===
  private listeners: Set<() => void> = new Set();
  
  // === REQUEST CACHE ===
  private inflightRequests = new Map<string, InflightRequest>();
  private readonly REQUEST_CACHE_TTL = 10000; // 10 seconds
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  
  // === RETRY TRACKING ===
  private retriedRequests = new WeakSet<Request>();
  
  // === CLEANUP TIMER ===
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // === REFRESH LOCK ===
  private refreshInProgress = false;
  private refreshPromise: Promise<void> | null = null;

  static getInstance(): AuthKernel {
    if (!AuthKernel.instance) {
      AuthKernel.instance = new AuthKernel();
      AuthKernel.instance.startCleanupTimer();
      console.log('[AUTH] AuthKernel v2 singleton created');
    }
    return AuthKernel.instance;
  }

  private constructor() {
    // Singleton constructor
  }

  // === STABLE STATE ACCESS ===
  getState(): AuthKernelState {
    return this.state;
  }

  // === LISTENER MANAGEMENT ===
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // === SESSION VERSION MANAGEMENT ===
  private incrementSessionVersion(): void {
    this.state.version++;
    this.inflightRequests.clear();
    
    console.log(`[AUTH] Session version: ${this.state.version}, status: ${this.state.status}`);
  }

  getVersion(): number {
    return this.state.version;
  }

  // === AUTH OPERATIONS ===
  async bootstrapSession(): Promise<void> {
    if (this.state.status === 'hydrating') return;
    
    this.state.status = 'hydrating';
    this.notifyListeners();

    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        this.state.user = data?.data?.user ?? data?.user ?? null;
        this.state.status = 'authenticated';
        this.incrementSessionVersion();
      } else if (response.status === 401) {
        this.state.user = null;
        this.state.status = 'anonymous';
        this.incrementSessionVersion();
      } else {
        throw new Error(`Session check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      this.state.user = null;
      this.state.status = 'error';
      this.incrementSessionVersion();
    } finally {
      this.notifyListeners();
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    // API returns { success, data: { user } }
    this.state.user = data.data?.user ?? data.user;
    this.state.status = 'authenticated';
    this.incrementSessionVersion();
    this.notifyListeners();
  }

  async logout(): Promise<void> {
    const currentVersion = this.state.version;
    
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (this.state.version === currentVersion) {
        this.state.user = null;
        this.state.status = 'anonymous';
        this.incrementSessionVersion();
      }
    }
  }

  private hasRefreshToken(): boolean {
    if (typeof document !== 'undefined') {
      return document.cookie.includes('refreshToken');
    }
    return false;
  }

  async refreshToken(): Promise<void> {
    if (!this.hasRefreshToken()) {
      this.state.status = 'expired';
      this.notifyListeners();
      return;
    }

    // Coalesce concurrent refresh calls onto one promise
    if (this.refreshInProgress && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshInProgress = true;
    const currentVersion = this.state.version;
    
    // Store the promise so concurrent callers can await it
    this.refreshPromise = (async () => {
      try {
        this.state.status = 'refreshing';
        this.notifyListeners();
        
        const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        
        if (!response.ok) {
          this.state.status = 'expired';
          this.state.user = null;
          this.incrementSessionVersion();
          throw new Error('Session expired');
        }

        if (this.state.version !== currentVersion) {
          console.warn('Session version changed during refresh, aborting');
          return;
        }

        const userResponse = await fetch('/api/auth/me', { credentials: 'include' });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          this.state.user = userData?.data?.user ?? userData?.user ?? null;
          this.state.status = 'authenticated';
          this.incrementSessionVersion();
        }
      } catch (error) {
        this.state.status = 'expired';
        this.state.user = null;
        this.incrementSessionVersion();
        throw error;
      } finally {
        this.refreshInProgress = false;
        this.refreshPromise = null;
        this.notifyListeners();
      }
    })();

    await this.refreshPromise;
  }

  // === API INTERCEPTOR ===
  async request(input: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
    if (this.isAuthEndpoint(input)) {
      return fetch(input, options);
    }

    const requestKey = this.getRequestKey(input, options);
    const existingRequest = this.inflightRequests.get(requestKey);
    
    if (existingRequest && Date.now() - existingRequest.timestamp < this.REQUEST_CACHE_TTL) {
      return existingRequest.promise;
    }

    const requestPromise = this.executeRequest(input, options);
    
    this.inflightRequests.set(requestKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    requestPromise.finally(() => {
      this.inflightRequests.delete(requestKey);
    });

    return requestPromise;
  }

  private async executeRequest(input: RequestInfo | URL, options: RequestInit): Promise<Response> {
    const currentVersion = this.state.version;
    
    let response = await fetch(input, options);

    if (response.status === 401) {
      if (this.state.status === 'anonymous' || this.state.status === 'expired') {
        return response;
      }

      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/auth/refresh')) {
        this.state.status = 'expired';
        this.state.user = null;
        this.incrementSessionVersion();
        this.notifyListeners();
        return response;
      }

      const request = input instanceof Request ? input : new Request(input, options);
      
      if (!this.retriedRequests.has(request)) {
        this.retriedRequests.add(request);
        
        try {
          await this.refreshToken();
          
          if (this.state.version !== currentVersion) {
            throw new Error('Session version changed during request');
          }
          
          response = await fetch(input, options);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          this.state.status = 'expired';
          this.state.user = null;
          this.incrementSessionVersion();
          this.notifyListeners();
        }
      }
    }

    return response;
  }

  private getRequestKey(input: RequestInfo | URL, options: RequestInit): string {
    const url = typeof input === 'string' ? input : input.toString();
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isAuthEndpoint(input: RequestInfo | URL): boolean {
    const url = typeof input === 'string' ? input : input.toString();
    return url.includes('/auth/') || url.includes('/login') || url.includes('/logout');
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredRequests();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now();
    
    for (const [key, request] of this.inflightRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_CACHE_TTL) {
        this.inflightRequests.delete(key);
      }
    }
  }

  // === PUBLIC API ===
  isAuthenticated(): boolean {
    return this.state.status === 'authenticated';
  }

  isRefreshing(): boolean {
    return this.state.status === 'refreshing';
  }

  isUnauthenticated(): boolean {
    return this.state.status === 'anonymous' || this.state.status === 'expired';
  }

  getCurrentUser(): User | null {
    return this.state.user;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.listeners.clear();
    this.inflightRequests.clear();
  }
}

// === CLEAN EXPORT ===
export const authKernel = AuthKernel.getInstance();
