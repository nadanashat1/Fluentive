"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { sessionManager, User, SessionState } from '@/lib/auth/session-manager-v2';
import { authStateMachine, AuthState, AuthEvent } from '@/lib/auth/auth-state-machine';
import { AuthError } from '@/lib/errors/AuthError';

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  loading: boolean;
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // === PURE SNAPSHOT FUNCTIONS ===
  // No derived logic, pure state access for useSyncExternalStore
  const getAuthSnapshot = () => {
    const sessionState = sessionManager.getSnapshot();
    const authState = authStateMachine.getCurrentState();
    
    return {
      user: sessionState.user,
      authState,
      loading: sessionState.loading,
      isRefreshing: sessionState.isRefreshing,
      isAuthenticated: !!sessionState.user
    };
  };

  // === SINGLE SOURCE OF TRUTH ===
  const snapshot = useSyncExternalStore(
    // Subscribe to both session manager and state machine
    (callback) => {
      const unsubscribeSession = sessionManager.subscribe(callback);
      const unsubscribeStateMachine = authStateMachine.subscribe(callback);
      
      return () => {
        unsubscribeSession();
        unsubscribeStateMachine();
      };
    },
    getAuthSnapshot,
    getAuthSnapshot // Server-side rendering fallback
  );

  // === BOOTSTRAP SESSION ===
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const bootstrap = async () => {
      await authStateMachine.transition(AuthEvent.BOOTSTRAP);
      
      try {
        await sessionManager.bootstrapSession();
        
        const user = sessionManager.getCurrentUser();
        if (user) {
          await authStateMachine.transition(AuthEvent.LOGIN_SUCCESS);
        } else {
          await authStateMachine.transition(AuthEvent.LOGIN_FAILURE);
        }
      } catch (error) {
        await authStateMachine.transition(AuthEvent.NETWORK_ERROR);
        console.error('Session bootstrap failed:', error);
      }
    };

    bootstrap();
  }, []);

  // === CROSS-TAB SYNC ===
  React.useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'auth_event') {
        // Auth event received from another tab
        sessionManager.logout();
        authStateMachine.transition(AuthEvent.LOGOUT);
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [router]);

  // === AUTH ACTIONS ===
  const login = async (email: string, password: string) => {
    try {
      await sessionManager.login(email, password);
      await authStateMachine.transition(AuthEvent.LOGIN_SUCCESS);
      
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      await authStateMachine.transition(AuthEvent.LOGIN_FAILURE);
      
      if (AuthError.isAuthError(error) && error.code === 'SESSION_EXPIRED') {
        await authStateMachine.transition(AuthEvent.SESSION_EXPIRED);
        await sessionManager.logout();
      } else {
        toast.error(error instanceof Error ? error.message : 'Login failed');
      }
      throw error;
    }
  };

  const logout = async () => {
    await sessionManager.logout();
    await authStateMachine.transition(AuthEvent.LOGOUT);
    
    // Notify other tabs to logout
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_event', Date.now().toString());
    }
    
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const refreshSession = async () => {
    const currentState = authStateMachine.getCurrentState();
    
    if (currentState === AuthState.AUTHENTICATED) {
      await authStateMachine.transition(AuthEvent.TOKEN_REFRESH);
      
      try {
        await sessionManager.refreshSession();
        await authStateMachine.transition(AuthEvent.TOKEN_REFRESH_SUCCESS);
      } catch (error) {
        await authStateMachine.transition(AuthEvent.TOKEN_REFRESH_FAILURE);
        throw error;
      }
    }
  };

  const value: AuthContextType = {
    user: snapshot.user,
    authState: snapshot.authState,
    loading: snapshot.loading,
    isRefreshing: snapshot.isRefreshing,
    login,
    logout,
    refreshSession,
    isAuthenticated: snapshot.isAuthenticated,
  };

  // === LOADING STATE ===
  if (snapshot.loading && !snapshot.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Import React for useEffect
import React from 'react';
