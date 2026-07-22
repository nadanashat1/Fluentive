/**
 * Centralized Auth Session Manager
 * Single source of truth for all auth operations
 * Prevents race conditions, duplicate calls, and scattered auth logic
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
}

class SessionManager {
  private static instance: SessionManager;
  private state: SessionState = {
    user: null,
    loading: false,
    isRefreshing: false
  };
  private listeners: Set<(state: SessionState) => void> = new Set();
  private refreshPromise: Promise<void> | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Subscribe to state changes (for React components)
  subscribe(listener: (state: SessionState) => void) {
    this.listeners.add(listener);
    listener(this.state); // Emit current state immediately
    return () => this.listeners.delete(listener);
  }

  // Emit state changes to all listeners
  private emit() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Get current state (snapshot)
  getState(): SessionState {
    return { ...this.state };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.state.user;
  }

  // Bootstrap session on app initialization
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

  // Check current session status
  private async checkSession(): Promise<void> {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        this.state.user = data.user;
      } else if (response.status === 401) {
        // Normal for unauthenticated session
        this.state.user = null;
      } else {
        throw new Error(`Session check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      this.state.user = null;
    }
  }

  // Login user
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

  // Logout user
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.state.user = null;
      this.emit();
    }
  }

  // Refresh session with deduplication
  async refreshSession(): Promise<void> {
    // INTERNAL GUARD: Don't refresh if no authenticated user
    if (!this.state.user) {
      return;
    }

    // DEDUPLICATION: Return existing refresh promise if in progress
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // RACE CONDITION PREVENTION: Only one refresh at a time
    if (this.state.isRefreshing) {
      return;
    }

    this.state.isRefreshing = true;
    this.emit();

    // Create and store refresh promise
    this.refreshPromise = this.doRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
      this.state.isRefreshing = false;
      this.emit();
    }
  }

  // Actual refresh implementation
  private async doRefresh(): Promise<void> {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Session expired');
      }
      await this.checkSession();
    } catch (error) {
      console.error('Session refresh failed:', error);
      await this.logout();
      throw error;
    }
  }

  // Handle visibility change (tab focus)
  handleVisibilityChange(): void {
    // EXPLICIT GUARDS: Check conditions before any API calls
    if (document.visibilityState !== 'visible') {
      return;
    }

    if (!this.state.user) {
      return;
    }

    // Only refresh if we have an authenticated user
    this.refreshSession().catch(error => {
      console.error('Tab focus refresh failed:', error);
    });
  }

  // Get current user (for convenience)
  getCurrentUser(): User | null {
    return this.state.user;
  }
}

export const sessionManager = SessionManager.getInstance();
export type { User, SessionState };
