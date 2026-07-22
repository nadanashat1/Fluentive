/**
 * Auth State Machine
 * Explicit state model for production-grade auth systems
 */

export enum AuthState {
  ANONYMOUS = 'anonymous',
  HYDRATING = 'hydrating', 
  AUTHENTICATED = 'authenticated',
  REFRESHING = 'refreshing',
  EXPIRED = 'expired',
  ERROR = 'error'
}

export enum AuthEvent {
  BOOTSTRAP = 'bootstrap',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_REFRESH_SUCCESS = 'token_refresh_success',
  TOKEN_REFRESH_FAILURE = 'token_refresh_failure',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  NETWORK_ERROR = 'network_error'
}

interface AuthTransition {
  from: AuthState;
  event: AuthEvent;
  to: AuthState;
  action?: () => void | Promise<void>;
}

class AuthStateMachine {
  private currentState: AuthState = AuthState.ANONYMOUS;
  private listeners: Set<(state: AuthState) => void> = new Set();
  
  // Define valid state transitions
  private transitions: Map<string, AuthTransition> = new Map([
    // Bootstrap flow
    [`${AuthState.ANONYMOUS}:${AuthEvent.BOOTSTRAP}`, {
      from: AuthState.ANONYMOUS,
      event: AuthEvent.BOOTSTRAP,
      to: AuthState.HYDRATING
    }],
    [`${AuthState.HYDRATING}:${AuthEvent.LOGIN_SUCCESS}`, {
      from: AuthState.HYDRATING,
      event: AuthEvent.LOGIN_SUCCESS,
      to: AuthState.AUTHENTICATED
    }],
    [`${AuthState.HYDRATING}:${AuthEvent.LOGIN_FAILURE}`, {
      from: AuthState.HYDRATING,
      event: AuthEvent.LOGIN_FAILURE,
      to: AuthState.ANONYMOUS
    }],
    
    // Login flow
    [`${AuthState.ANONYMOUS}:${AuthEvent.LOGIN_SUCCESS}`, {
      from: AuthState.ANONYMOUS,
      event: AuthEvent.LOGIN_SUCCESS,
      to: AuthState.AUTHENTICATED
    }],
    [`${AuthState.ANONYMOUS}:${AuthEvent.LOGIN_FAILURE}`, {
      from: AuthState.ANONYMOUS,
      event: AuthEvent.LOGIN_FAILURE,
      to: AuthState.ANONYMOUS
    }],
    
    // Token refresh flow
    [`${AuthState.AUTHENTICATED}:${AuthEvent.TOKEN_REFRESH}`, {
      from: AuthState.AUTHENTICATED,
      event: AuthEvent.TOKEN_REFRESH,
      to: AuthState.REFRESHING
    }],
    [`${AuthState.REFRESHING}:${AuthEvent.TOKEN_REFRESH_SUCCESS}`, {
      from: AuthState.REFRESHING,
      event: AuthEvent.TOKEN_REFRESH_SUCCESS,
      to: AuthState.AUTHENTICATED
    }],
    [`${AuthState.REFRESHING}:${AuthEvent.TOKEN_REFRESH_FAILURE}`, {
      from: AuthState.REFRESHING,
      event: AuthEvent.TOKEN_REFRESH_FAILURE,
      to: AuthState.EXPIRED
    }],
    
    // Session expiration
    [`${AuthState.AUTHENTICATED}:${AuthEvent.SESSION_EXPIRED}`, {
      from: AuthState.AUTHENTICATED,
      event: AuthEvent.SESSION_EXPIRED,
      to: AuthState.EXPIRED
    }],
    [`${AuthState.REFRESHING}:${AuthEvent.SESSION_EXPIRED}`, {
      from: AuthState.REFRESHING,
      event: AuthEvent.SESSION_EXPIRED,
      to: AuthState.EXPIRED
    }],
    
    // Logout flow
    [`${AuthState.AUTHENTICATED}:${AuthEvent.LOGOUT}`, {
      from: AuthState.AUTHENTICATED,
      event: AuthEvent.LOGOUT,
      to: AuthState.ANONYMOUS
    }],
    [`${AuthState.REFRESHING}:${AuthEvent.LOGOUT}`, {
      from: AuthState.REFRESHING,
      event: AuthEvent.LOGOUT,
      to: AuthState.ANONYMOUS
    }],
    [`${AuthState.EXPIRED}:${AuthEvent.LOGOUT}`, {
      from: AuthState.EXPIRED,
      event: AuthEvent.LOGOUT,
      to: AuthState.ANONYMOUS
    }],
    
    // Error handling
    [`${AuthState.HYDRATING}:${AuthEvent.NETWORK_ERROR}`, {
      from: AuthState.HYDRATING,
      event: AuthEvent.NETWORK_ERROR,
      to: AuthState.ERROR
    }],
    [`${AuthState.AUTHENTICATED}:${AuthEvent.NETWORK_ERROR}`, {
      from: AuthState.AUTHENTICATED,
      event: AuthEvent.NETWORK_ERROR,
      to: AuthState.ERROR
    }],
    [`${AuthState.REFRESHING}:${AuthEvent.NETWORK_ERROR}`, {
      from: AuthState.REFRESHING,
      event: AuthEvent.NETWORK_ERROR,
      to: AuthState.ERROR
    }],
    [`${AuthState.EXPIRED}:${AuthEvent.NETWORK_ERROR}`, {
      from: AuthState.EXPIRED,
      event: AuthEvent.NETWORK_ERROR,
      to: AuthState.ERROR
    }],
    [`${AuthState.ERROR}:${AuthEvent.LOGIN_SUCCESS}`, {
      from: AuthState.ERROR,
      event: AuthEvent.LOGIN_SUCCESS,
      to: AuthState.AUTHENTICATED
    }],
    [`${AuthState.ERROR}:${AuthEvent.LOGOUT}`, {
      from: AuthState.ERROR,
      event: AuthEvent.LOGOUT,
      to: AuthState.ANONYMOUS
    }]
  ]);

  // Get current state
  getCurrentState(): AuthState {
    return this.currentState;
  }

  // Check if transition is valid
  canTransition(from: AuthState, event: AuthEvent): boolean {
    return this.transitions.has(`${from}:${event}`);
  }

  // Execute state transition
  async transition(event: AuthEvent, action?: () => void | Promise<void>): Promise<boolean> {
    const transitionKey = `${this.currentState}:${event}`;
    const transition = this.transitions.get(transitionKey);
    
    if (!transition) {
      console.warn(`Invalid transition: ${this.currentState} -> ${event}`);
      return false;
    }

    // Execute action if provided
    if (action) {
      try {
        await action();
      } catch (error) {
        console.error('Transition action failed:', error);
        return false;
      }
    }

    // Update state
    this.currentState = transition.to;
    this.notifyListeners();
    
    return true;
  }

  // Subscribe to state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentState); // Emit current state immediately
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  // State utilities
  isAuthenticated(): boolean {
    return this.currentState === AuthState.AUTHENTICATED;
  }

  isRefreshing(): boolean {
    return this.currentState === AuthState.REFRESHING;
  }

  isHydrating(): boolean {
    return this.currentState === AuthState.HYDRATING;
  }

  isExpired(): boolean {
    return this.currentState === AuthState.EXPIRED;
  }

  hasError(): boolean {
    return this.currentState === AuthState.ERROR;
  }

  // Reset to initial state
  reset(): void {
    this.currentState = AuthState.ANONYMOUS;
    this.notifyListeners();
  }
}

export const authStateMachine = new AuthStateMachine();
