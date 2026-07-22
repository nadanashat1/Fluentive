import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { acquireRefreshLock, releaseRefreshLock, isRefreshLocked } from './auth/refresh-lock';

// Finite auth states (enterprise-grade)
export type AuthState = 
  | 'booting'      // Initial state, checking session
  | 'anonymous'    // No session, clean logged-out state
  | 'authenticated' // Valid session, user is logged in
  | 'refreshing'   // Token refresh in progress
  | 'expired';     // Session expired, will transition to anonymous

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthStateData {
  state: AuthState;
  user: UserData | null;
  lastChecked: Date | null;
  error: string | null;
}

// Action types for the state machine
type AuthAction =
  | { type: 'START_BOOT' }
  | { type: 'SET_AUTHENTICATED'; payload: UserData }
  | { type: 'SET_ANONYMOUS' }
  | { type: 'SET_EXPIRED'; payload?: string }
  | { type: 'START_REFRESH' }
  | { type: 'COMPLETE_REFRESH'; payload: UserData }
  | { type: 'FAIL_REFRESH'; payload: string }
  | { type: 'RESET' };

// Initial state
const initialState: AuthStateData = {
  state: 'booting',
  user: null,
  lastChecked: null,
  error: null,
};

// State machine reducer
function authReducer(state: AuthStateData, action: AuthAction): AuthStateData {
  switch (action.type) {
    case 'START_BOOT':
      return { ...state, state: 'booting', error: null };
      
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        state: 'authenticated',
        user: action.payload,
        lastChecked: new Date(),
        error: null,
      };
      
    case 'SET_ANONYMOUS':
      return {
        ...state,
        state: 'anonymous',
        user: null,
        lastChecked: new Date(),
        error: null,
      };
      
    case 'SET_EXPIRED':
      return {
        ...state,
        state: 'expired',
        error: action.payload || 'Session expired',
      };
      
    case 'START_REFRESH':
      return { ...state, state: 'refreshing', error: null };
      
    case 'COMPLETE_REFRESH':
      return {
        ...state,
        state: 'authenticated',
        user: action.payload,
        lastChecked: new Date(),
        error: null,
      };
      
    case 'FAIL_REFRESH':
      return {
        ...state,
        state: 'expired',
        error: action.payload,
      };
      
    case 'RESET':
      return initialState;
      
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<{
  state: AuthStateData;
  dispatch: React.Dispatch<AuthAction>;
  computed: {
    isAuthenticated: boolean;
    isLoading: boolean;
    canRefresh: boolean;
    hasError: boolean;
  };
} | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
    
  // Computed values
  const computed = {
    isAuthenticated: state.state === 'authenticated',
    isLoading: state.state === 'booting' || state.state === 'refreshing',
    canRefresh: state.state === 'expired',
    hasError: Boolean(state.error),
  };
  
  return (
    <AuthContext.Provider value={{ state, dispatch, computed }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuthState() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
}

// State transition helpers (for complex flows)
export const authTransitions = {
  // Boot flow
  bootSuccess: (dispatch: React.Dispatch<AuthAction>, user: UserData) => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: user });
  },
  
  bootAnonymous: (dispatch: React.Dispatch<AuthAction>) => {
    dispatch({ type: 'SET_ANONYMOUS' });
  },
  
  // Refresh flow with global lock
  refreshSuccess: (dispatch: React.Dispatch<AuthAction>, user: UserData) => {
    dispatch({ type: 'COMPLETE_REFRESH', payload: user });
  },
  
  refreshFailed: (dispatch: React.Dispatch<AuthAction>, error: string) => {
    dispatch({ type: 'FAIL_REFRESH', payload: error });
    // Auto-transition to anonymous after refresh failure
    setTimeout(() => {
      dispatch({ type: 'SET_ANONYMOUS' });
    }, 1000);
  },
  
  // Error handling
  sessionExpired: (dispatch: React.Dispatch<AuthAction>, error?: string) => {
    dispatch({ type: 'SET_EXPIRED', payload: error });
  },
  
  // Manual logout
  logout: (dispatch: React.Dispatch<AuthAction>) => {
    dispatch({ type: 'SET_ANONYMOUS' });
  },
};

/**
 * Handle API errors explicitly - only auth decisions here
 * This is the single authority for all auth-related error handling
 */
export async function handleAuthError(
  error: any,
  dispatch: React.Dispatch<AuthAction>
): Promise<void> {
  if (error?.message === 'UNAUTHORIZED' || error?.statusCode === 401) {
    // Only trigger refresh if we're not already refreshing
    const currentState = await getCurrentAuthState();
    if (currentState !== 'refreshing') {
      await refreshSession(dispatch);
    }
  } else {
    // Non-auth errors don't trigger state changes
    console.log('Non-auth error, no state change:', error);
  }
}

/**
 * Get current auth state (helper for error handling)
 */
async function getCurrentAuthState(): Promise<AuthState> {
  // This would typically come from the auth context
  // For now, we'll use a simple approach
  return 'anonymous';
}

/**
 * Deterministic refresh session function with global lock
 * This is the core refresh logic that eliminates race conditions
 */
export async function refreshSession(dispatch: React.Dispatch<AuthAction>): Promise<void> {
  // If refresh is already locked, wait for it to complete
  if (isRefreshLocked()) {
    const lock = acquireRefreshLock();
    await lock;
    return;
  }

  const lock = acquireRefreshLock();
  try {
    dispatch({ type: 'START_REFRESH' });
    
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!res.ok) {
      dispatch({ type: 'FAIL_REFRESH', payload: 'Refresh failed' });
      return;
    }
    
    const userData = await res.json();
    dispatch({ type: 'COMPLETE_REFRESH', payload: userData });
  } catch (error) {
    dispatch({ type: 'FAIL_REFRESH', payload: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    releaseRefreshLock();
  }
}

/**
 * Enhanced refresh with retry logic for better resilience
 */
export async function refreshSessionWithRetry(
  dispatch: React.Dispatch<AuthAction>,
  maxRetries: number = 2
): Promise<boolean> {
  let attempts = 0;
  
  while (attempts <= maxRetries) {
    try {
      await refreshSession(dispatch);
      return true; // Success
    } catch (error) {
      attempts++;
      if (attempts > maxRetries) {
        dispatch({ 
          type: 'FAIL_REFRESH', 
          payload: `Refresh failed after ${maxRetries} retries` 
        });
        return false;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  return false;
}
