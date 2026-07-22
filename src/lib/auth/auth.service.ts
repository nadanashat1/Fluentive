// Stripe-style auth service - single authority for all auth behavior
// Production-hardened with SSR hydration, refresh race safety, and multi-tab consistency

import { HttpError } from "../api-client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// SSR hydration payload interface
export interface AuthHydrationPayload {
  user: User | null;
  isAuthenticated: boolean;
}

type AuthListener = (state: AuthState) => void;

// Multi-tab broadcast events
type AuthBroadcastEvent = 
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" }
  | { type: "TOKEN_REFRESHED"; user: User };

// Production-grade refresh race safety
let refreshPromise: Promise<void> | null = null;

// Broadcast channel for multi-tab consistency
let broadcastChannel: BroadcastChannel | null = null;

// Initialize broadcast channel only in browser
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  broadcastChannel = new BroadcastChannel("auth");
}

// Single auth service - THE ONLY CORE
class AuthService {
  private state: AuthState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  };
  
  private listeners: Set<AuthListener> = new Set();

  // State access
  getState(): AuthState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Internal state update with broadcast
  private setState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
    
    // Broadcast to other tabs
    if (broadcastChannel) {
      if (updates.user && updates.isAuthenticated) {
        broadcastChannel.postMessage({ type: "LOGIN", user: updates.user });
      } else if (updates.user === null && !updates.isAuthenticated) {
        broadcastChannel.postMessage({ type: "LOGOUT" });
      }
    }
  }

  // SSR hydration - consume server state once, never recreate
  hydrate(payload: AuthHydrationPayload): void {
    if (payload.user && payload.isAuthenticated) {
      this.setState({
        user: payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }

  // Boot - check initial session (only if not hydrated)
  async boot(): Promise<void> {
    // Skip boot if already has state from hydration
    if (this.state.user !== null || this.state.isAuthenticated) {
      return;
    }

    try {
      this.setState({ isLoading: true, error: null });
      
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (res.ok) {
        const user = await res.json();
        this.setState({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        this.setState({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    } catch (error) {
      this.setState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: "Failed to check session"
      });
    }
  }

  // Login
  async login(email: string, password: string): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const user = await res.json();
        this.setState({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      this.setState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: "Login failed"
      });
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout errors
    } finally {
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }

  // Handle HTTP errors - single place for auth decisions
  async handleHttpError(error: unknown): Promise<void> {
    if (error instanceof HttpError && error.status === 401) {
      await this.refreshSession();
    }
    // Non-401 errors are ignored by auth layer
  }

  // Refresh session - production-grade with race safety
  private async refreshSession(): Promise<void> {
    // Return existing refresh promise if already in progress
    if (refreshPromise) {
      await refreshPromise;
      return;
    }

    // Create new refresh promise
    refreshPromise = (async () => {
      try {
        this.setState({ isLoading: true, error: null });

        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const user = await res.json();
          this.setState({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          // Refresh failed - clear session
          this.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Session expired",
          });
        }
      } catch (error) {
        this.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Refresh failed",
        });
      } finally {
        // Clear refresh promise when done
        refreshPromise = null;
      }
    })();

    await refreshPromise;
  }

  // Listen to broadcast events from other tabs
  public setupBroadcastListener(): void {
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event: MessageEvent<AuthBroadcastEvent>) => {
        switch (event.data.type) {
          case "LOGIN":
            this.setState({
              user: event.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            break;
          case "LOGOUT":
            this.setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            break;
          case "TOKEN_REFRESHED":
            this.setState({
              user: event.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            break;
        }
      };
    }
  }
}

// Singleton instance - simple, no factory
export const authService = new AuthService();

// Setup broadcast listener immediately
authService.setupBroadcastListener();

