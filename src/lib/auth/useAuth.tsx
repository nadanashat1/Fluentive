// Thin useAuth hook - simple React binding to auth service
// No adapter system, no engine abstraction

import { useState, useEffect, useCallback } from 'react';
import { authService, AuthState, User } from './auth.service';

export function useAuth() {
  const [state, setState] = useState<AuthState>(authService.getState());

  // Subscribe to auth service changes
  useEffect(() => {
    const unsubscribe = authService.subscribe(setState);
    return unsubscribe;
  }, []);

  // Boot auth service on mount
  useEffect(() => {
    authService.boot();
  }, []);

  // Memoized actions to prevent unnecessary re-renders
  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  const handleHttpError = useCallback(async (error: unknown) => {
    await authService.handleHttpError(error);
  }, []);

  const refreshSession = useCallback(async () => {
    // Force refresh by triggering a 401 error handling
    await authService.handleHttpError(new (class extends Error {
      constructor() {
        super('Unauthorized');
        this.name = 'HttpError';
      }
      status = 401;
    })());
  }, []);

  return {
    // State
    ...state,
    
    // Computed values
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasError: !!state.error,
    error: state.error,
    
    // Actions
    login,
    logout,
    handleHttpError,
    refreshSession,
    
    // Convenience
    canRefresh: !state.isAuthenticated && !state.isLoading,
  };
}

// Provider component for app-level setup
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  
  // Just render children - the hook handles everything
  return <>{children}</>;
}
