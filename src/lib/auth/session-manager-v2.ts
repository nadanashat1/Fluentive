/**
 * Production-Grade Auth Session Manager
 * Single source of truth with proper deduplication and race condition prevention
 */

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface SessionState {
  user: User | null;
  loading: boolean;
  isRefreshing: boolean;
  sessionVersion: number;
}

interface SessionSnapshot {
  getState: () => SessionState;
  getSnapshot: () => SessionState;
  subscribe: (listener: () => void) => () => void;
}

class SessionManager implements SessionSnapshot {
  private static instance: SessionManager;
  private state: SessionState = {
    user: null,
    loading: false,
    isRefreshing: false,
    sessionVersion: 0
  };
  private listeners: Set<() => void> = new Set();
  private refreshPromise: Promise<void> | null = null;
  private sessionVersionCounter: number = 0;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // === SYNC EXTERNAL STORE INTERFACE ===
  getState(): SessionState {
    return { ...this.state };
  }

  getSnapshot(): SessionState {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    listener(); // Emit current state immediately
    
    // Return deterministic cleanup function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // === INTERNAL STATE MANAGEMENT ===
  private emit(): void {
    this.listeners.forEach(listener => listener());
  }

  private incrementSessionVersion(): void {
    this.sessionVersionCounter++;
    this.state.sessionVersion = this.sessionVersionCounter;
  }

  // === SESSION OPERATIONS ===
  async bootstrapSession(): Promise<void> {
    if (this.state.loading) {
      return; // Already bootstrapping
    }

    this.state.loading = true;
    this.emit();

    try {
      await this.checkSession();
    } finally {
      this.state.loading = false;
      this.emit();
    }
  }

  private async checkSession(): Promise<void> {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        this.state.user = data.user;
        this.incrementSessionVersion();
      } else if (response.status === 401) {
        // Normal for unauthenticated session
        this.state.user = null;
        this.incrementSessionVersion();
      } else {
        throw new Error(`Session check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      this.state.user = null;
      this.incrementSessionVersion();
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.state.loading = true;
    this.emit();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      // After successful login, check session to get user data
      await this.checkSession();
      this.emit();
    } catch (error) {
      this.state.loading = false;
      this.emit();
      throw error;
    }
  }

  async logout(): Promise<void> {
    const currentVersion = this.state.sessionVersion;
    
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Only update state if version hasn't changed (prevents race conditions)
      if (this.state.sessionVersion === currentVersion) {
        this.state.user = null;
        this.incrementSessionVersion();
        this.emit();
      }
    }
  }

  // === PRODUCTION-GRADE REFRESH LOGIC ===
  async refreshSession(): Promise<void> {
    // INTERNAL GUARD: Don't refresh if no authenticated user
    if (!this.state.user) {
      return;
    }

    // DEDUPLICATION: Return existing refresh promise if in progress
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create refresh promise with proper error handling
    this.refreshPromise = this.doRefreshWithLock();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshWithLock(): Promise<void> {
    const currentVersion = this.state.sessionVersion;
    
    // Set refresh state
    this.state.isRefreshing = true;
    this.emit();

    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Session expired');
      }

      // Check if session version changed during refresh (race condition guard)
      if (this.state.sessionVersion !== currentVersion) {
        console.warn('Session version changed during refresh, aborting');
        return;
      }

      await this.checkSession();
    } catch (error) {
      console.error('Session refresh failed:', error);
      
      // Only logout if version hasn't changed (prevents race conditions)
      if (this.state.sessionVersion === currentVersion) {
        await this.logout();
      }
      throw error;
    } finally {
      // Always clear refresh state
      this.state.isRefreshing = false;
      this.emit();
    }
  }

  // === API INTERCEPTOR INTEGRATION ===
  async handleApiRequest(request: RequestInfo, options?: RequestInit): Promise<Response> {
    // Try the request first
    let response = await fetch(request, options);

    // If 401, attempt refresh once
    if (response.status === 401 && this.state.user) {
      try {
        await this.refreshSession();
        // Retry the original request with new tokens
        response = await fetch(request, options);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, let the original 401 response propagate
      }
    }

    return response;
  }

  // === UTILITY METHODS ===
  getCurrentUser(): User | null {
    return this.state.user;
  }

  isAuthenticated(): boolean {
    return !!this.state.user;
  }

  getSessionVersion(): number {
    return this.state.sessionVersion;
  }

  // Remove visibility-driven refresh - let API interceptor handle it
  // handleVisibilityChange(): void {
  //   // REMOVED: Let API interceptor drive refresh logic
  // }
}

export const sessionManager = SessionManager.getInstance();
export type { User, SessionState, SessionSnapshot };
