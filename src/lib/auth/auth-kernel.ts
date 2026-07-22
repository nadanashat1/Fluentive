// === AUTH KERNEL - SINGLE AUTHORITY ===

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  createdAt: string;
}

enum AuthState {
  ANONYMOUS = 'anonymous',
  HYDRATING = 'hydrating',
  AUTHENTICATED = 'authenticated',
  REFRESHING = 'refreshing',
  EXPIRED = 'expired',
  ERROR = 'error'
}

enum AuthEvent {
  BOOTSTRAP = 'bootstrap',
  LOGIN_SUCCESS = 'login_success',
  TOKEN_REFRESH_SUCCESS = 'token_refresh_success',
  SESSION_EXPIRED = 'session_expired',
  LOGOUT = 'logout',
  NETWORK_ERROR = 'network_error'
}

interface AuthKernelState {
  status: AuthState;
  user: User | null;
  version: number;
}

interface InflightRequest {
  promise: Promise<Response>;
  timestamp: number;
}

class AuthKernel {
  private static instance: AuthKernel;
  
  // === STABLE STATE REFERENCE ===
  private state: AuthKernelState = {
    status: AuthState.ANONYMOUS,
    user: null,
    version: 0
  };
  
  // === LISTENERS (PROPERLY INITIALIZED) ===
  private listeners: Set<() => void>;
  
  // === REQUEST CACHE ===
  private inflightRequests = new Map<string, InflightRequest>();
  private readonly REQUEST_CACHE_TTL = 10000; // 10 seconds
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  
  // === RETRY TRACKING ===
  private retriedRequests = new WeakSet<Request>();
  
  // === BOOTSTRAP GUARDS (Persistent across React remounts) ===
  private hasBootstrapped = false;
  private bootstrapInFlight = false;
  private isFetchingUser = false; // ✅ ADDED: Prevent duplicate user fetches
  
  // ✅ CRITICAL: User cache to prevent repeated database fetches
  private userCache: User | null = null;
  private userCacheTimestamp: number = 0;
  private readonly USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // === REFRESH LOCK ===
  private refreshInProgress = false;
  private refreshPromise: Promise<void> | null = null;

  static getInstance(): AuthKernel {
    if (!AuthKernel.instance) {
      AuthKernel.instance = new AuthKernel();
    }
    return AuthKernel.instance;
  }

  private constructor() {
    // ✅ CRITICAL: Initialize listeners properly
    this.listeners = new Set<() => void>();
  }

  // === STABLE STATE ACCESS (CRITICAL) ===
  // Return the same state reference - don't create new objects
  getState = (): AuthKernelState => this.state;

  // === LISTENER MANAGEMENT (CRITICAL SAFETY) ===
  subscribe = (listener: () => void): (() => void) => {
    // ✅ SAFETY: Ensure listeners is initialized
    if (!this.listeners) {
      this.listeners = new Set<() => void>();
    }
    
    this.listeners.add(listener);
    
    return () => {
      if (this.listeners) {
        this.listeners.delete(listener);
      }
    };
  }

  private notifyListeners(): void {
    // ✅ CRITICAL: Ensure listeners exists and handle errors safely
    if (!this.listeners) return;
    
    // ✅ SAFETY: Use for...of loop with try/catch to prevent crashes
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('[AuthKernel] Listener error:', error);
        // Continue with other listeners even if one fails
      }
    }
  }

  // === SESSION VERSION MANAGEMENT ===
  private incrementSessionVersion(): void {
    // ✅ CRITICAL FIX: Create a NEW state object so useSyncExternalStore detects changes
    this.state = {
      ...this.state,
      version: this.state.version + 1
    };
    
    // Clear inflight requests when session changes to prevent stale data leaks
    this.inflightRequests.clear();
    
    // ✅ DEBUG LOG: Track session version changes
    if (typeof window !== 'undefined') {
      console.log(`[AUTH] Session version incremented to ${this.state.version}, state: ${this.state.status}`);
    }
  }

  getVersion(): number {
    return this.state.version;
  }

  // === AUTH OPERATIONS (CANONICAL AUTHORITY) ===
  async bootstrapSession(): Promise<void> {
    // ✅ CRITICAL GUARD: Prevent React StrictMode double execution & re-entrant calls
    if (this.hasBootstrapped || this.bootstrapInFlight || this.isFetchingUser) {
      console.log('[AuthKernel] Bootstrap blocked by guard - already executed or in flight');
      return;
    }
    
    if (this.state.status === AuthState.HYDRATING) return;
    
    // ✅ CRITICAL: Check user cache first to prevent repeated API calls
    const now = Date.now();
    if (this.userCache && (now - this.userCacheTimestamp) < this.USER_CACHE_TTL) {
      console.log('[AuthKernel] Using cached user:', this.userCache.email);
      this.state.user = this.userCache;
      this.state.status = AuthState.AUTHENTICATED;
      this.hasBootstrapped = true;
      this.notifyListeners();
      return;
    }
    
    this.bootstrapInFlight = true;
    this.isFetchingUser = true; // ✅ ADDED: Prevent duplicate user fetches
    this.state.status = AuthState.HYDRATING;
    this.notifyListeners();

    try {
      console.log('[AuthKernel] Bootstrapping session...');
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        
        // ✅ CRITICAL: Update state IMMEDIATELY after successful fetch
        this.state = {
          ...this.state,
          user: data.user || data.data?.user || data.data,
          status: AuthState.AUTHENTICATED
        };
        
        // ✅ CRITICAL: Update user cache
        this.userCache = data.user || data.data?.user || data.data;
        this.userCacheTimestamp = now;
        
        this.hasBootstrapped = true;
        this.incrementSessionVersion();
        
        // ✅ CRITICAL: Notify listeners IMMEDIATELY
        this.notifyListeners();
        
        console.log('[AuthKernel] Bootstrap completed successfully:', this.state.user?.email);
      } else if (response.status === 401) {
        // Normal for unauthenticated session
        this.state = {
          ...this.state,
          user: null,
          status: AuthState.ANONYMOUS
        };
        this.hasBootstrapped = true;
        this.incrementSessionVersion();
        this.notifyListeners();
        console.log('[AuthKernel] Bootstrap completed - user not authenticated');
      } else {
        throw new Error(`Session check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      this.state = {
        ...this.state,
        user: null,
        status: AuthState.ERROR
      };
      this.hasBootstrapped = true;
      this.incrementSessionVersion();
      this.notifyListeners();
    } finally {
      this.bootstrapInFlight = false;
      this.isFetchingUser = false; // ✅ ADDED: Reset fetch guard
      this.notifyListeners(); // ✅ ENSURE: Final notification
    }
  }

  async login(email: string, password: string): Promise<void> {
    // ✅ CRITICAL GUARD: Prevent duplicate login attempts
    if (this.isFetchingUser) {
      console.log('[AuthKernel] Login blocked - user fetch in progress');
      return;
    }

    this.isFetchingUser = true;
    
    try {
      // Step 1: Perform login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // 🔥 CRITICAL: Include cookies in response
      });

      if (!loginResponse.ok) {
        throw new Error('Login failed');
      }

      const loginPayload = await loginResponse.json().catch(() => ({}));
      const accessFromBody =
        loginPayload?.data?.token || loginPayload?.token;
      if (accessFromBody && typeof window !== 'undefined') {
        localStorage.setItem('token', accessFromBody);
        localStorage.setItem('dfluency.token', accessFromBody);
      }

      // Step 2: Wait for cookies to be properly set (small delay to prevent race conditions)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Verify auth by calling /api/auth/me to ensure cookies are set
      console.log('[AuthKernel] Verifying auth after login...');
      const meResponse = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (!meResponse.ok) {
        throw new Error('Auth verification failed');
      }

      const meData = await meResponse.json();
      console.log('[AuthKernel] Auth verified successfully:', meData.user || meData.data?.user || meData.data);
      
      // Handle different response formats
      const userData = meData.user || meData.data?.user || meData.data;
      if (!userData) {
        throw new Error('No user data in response');
      }
      
      // Step 4: Set authenticated state IMMEDIATELY after verification
      this.state = {
        ...this.state,
        user: userData,
        status: AuthState.AUTHENTICATED
      };
      
      // Update user cache
      this.userCache = userData;
      this.userCacheTimestamp = Date.now();
      
      // Mark as bootstrapped to prevent re-initialization
      this.hasBootstrapped = true;
      
      this.incrementSessionVersion();
      
      // ✅ CRITICAL: Notify listeners IMMEDIATELY
      this.notifyListeners();
      
      console.log('[AuthKernel] Login completed successfully:', userData.email);
    } finally {
      this.isFetchingUser = false;
    }
  }

  async logout(): Promise<void> {
    const currentVersion = this.state.version;
    
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('dfluency.token');
        localStorage.removeItem('refreshToken');
      }
      // Only update if version hasn't changed (race condition guard)
      if (this.state.version === currentVersion) {
        this.state = {
          ...this.state,
          user: null,
          status: AuthState.ANONYMOUS
        };
        this.hasBootstrapped = false;
        this.userCache = null;
        this.userCacheTimestamp = 0;
        this.incrementSessionVersion();
      }
    }
  }

  // Check if we have refresh token
  private hasRefreshToken(): boolean {
    // Check if refresh token exists in cookies
    if (typeof document !== 'undefined') {
      return document.cookie.includes('refreshToken');
    }
    return false;
  }

  async refreshToken(): Promise<void> {
    // ✅ CRITICAL GUARD: Don't refresh if no refresh token
    if (!this.hasRefreshToken()) {
      this.state.status = AuthState.EXPIRED;
      this.notifyListeners();
      return;
    }

    // ✅ CRITICAL GUARD: Prevent concurrent refresh attempts
    if (this.refreshInProgress && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshInProgress = true;
    const currentVersion = this.state.version;
    
    try {
      this.state.status = AuthState.REFRESHING;
      this.notifyListeners();
      
      const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      
      if (!response.ok) {
        // ✅ CRITICAL FIX: Clear session and stop retry on failure
        this.state = {
          ...this.state,
          user: null,
          status: AuthState.EXPIRED
        };
        this.incrementSessionVersion();
        throw new Error('Session expired');
      }

      // Check if version changed during refresh (race condition guard)
      if (this.state.version !== currentVersion) {
        console.warn('Session version changed during refresh, aborting');
        return;
      }

      // Update user data after successful refresh
      const userResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        this.state = {
          ...this.state,
          user: userData.data || userData.user,
          status: AuthState.AUTHENTICATED
        };
        this.incrementSessionVersion();
      }
    } catch (error) {
      // ✅ CRITICAL FIX: Clear session on any refresh error
      this.state = {
        ...this.state,
        user: null,
        status: AuthState.EXPIRED
      };
      this.incrementSessionVersion();
      throw error;
    } finally {
      this.refreshInProgress = false;
      this.refreshPromise = null;
      this.notifyListeners();
    }
  }

  // === API INTERCEPTOR (INTERNAL) ===
  async request(input: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
    // Skip auth for auth endpoints
    if (this.isAuthEndpoint(input)) {
      return fetch(input, options);
    }

    // === REQUEST COALESCING WITH TTL ===
    const requestKey = this.getRequestKey(input, options);
    const existingRequest = this.inflightRequests.get(requestKey);
    
    // On-demand cleanup for Vercel serverless compatibility
    this.cleanupExpiredRequests();
    
    if (existingRequest && Date.now() - existingRequest.timestamp < this.REQUEST_CACHE_TTL) {
      return existingRequest.promise;
    }

    const requestPromise = this.executeRequest(input, options);
    
    // Store with timestamp
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

  private async executeRequest(input: RequestInfo | URL, options: RequestInit): Promise<Response> {
    const currentVersion = this.state.version;
    
    // Try request first
    let response = await fetch(input, options);

    // === 401 HANDLING WITH REQUEST IDENTITY LOCKING ===
    if (response.status === 401) {
      // ✅ CRITICAL GUARD: Don't retry if already unauthenticated
      if (this.state.status === AuthState.ANONYMOUS || this.state.status === AuthState.EXPIRED) {
        return response;
      }

      // ✅ CRITICAL GUARD: Don't retry if request is refresh itself
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/auth/refresh')) {
        this.state = {
          ...this.state,
          user: null,
          status: AuthState.EXPIRED
        };
        this.incrementSessionVersion();
        this.notifyListeners();
        return response;
      }

      const request = input instanceof Request ? input : new Request(input, options);
      
      // Only retry if this specific request hasn't been retried before
      if (!this.retriedRequests.has(request)) {
        this.retriedRequests.add(request);
        
        try {
          await this.refreshToken();
          
          // === STALE RESPONSE REJECTION ===
          // If session version changed during refresh, abort this request
          if (this.state.version !== currentVersion) {
            throw new Error('Session version changed during request');
          }
          
          // Retry the original request with new tokens
          response = await fetch(input, options);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // ✅ CRITICAL FIX: Clear session and stop retry on any refresh error
          this.state = {
            ...this.state,
            user: null,
            status: AuthState.EXPIRED
          };
          this.incrementSessionVersion();
          this.notifyListeners();
          // Don't retry - let the original 401 response propagate
        }
      }
    }

    return response;
  }

  // === UTILITY METHODS ===
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
    return this.state.status === AuthState.AUTHENTICATED;
  }

  isRefreshing(): boolean {
    return this.state.status === AuthState.REFRESHING;
  }

  isUnauthenticated(): boolean {
    return this.state.status === AuthState.ANONYMOUS || this.state.status === AuthState.EXPIRED;
  }

  getCurrentUser(): User | null {
    return this.state.user;
  }

  // === CLEANUP ===
  destroy(): void {
    // No cleanup timer to clear for Vercel serverless compatibility
    this.listeners.clear();
    this.inflightRequests.clear();
  }
}

// === SINGLETON EXPORT (CRITICAL) ===
const globalForAuth = globalThis as unknown as {
  __authKernel?: AuthKernel;
};

export const authKernel = globalForAuth.__authKernel ?? AuthKernel.getInstance();

if (process.env.NODE_ENV !== "production") {
  globalForAuth.__authKernel = authKernel;
}

// === EXPORT TYPES ===
export type { User, AuthEvent, AuthKernelState };
export { AuthState };
