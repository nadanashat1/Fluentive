"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authKernel, AuthState, User, AuthKernelState } from '@/lib/auth/auth-kernel';
import { AuthError } from '@/lib/errors/AuthError';

// === EXPLICIT AUTH STATE MACHINE ===
type AuthStateUnion = 
  | { status: 'idle' }
  | { status: 'hydrating' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' }
  | { status: 'refreshing'; user: User }
  | { status: 'error'; error?: string };

interface AuthContextType {
  state: AuthStateUnion;
  user: User | null; // ✅ ADDED: Easy access to user
  loading: boolean;
  isRefreshing: boolean;
  hasAuth: boolean; // ✅ ADDED: hasAuth for immediate auth check
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // === STATE MACHINE CONVERSION ===
  // Convert AuthKernel state to explicit state machine
  const getAuthState = (kState: AuthKernelState): AuthStateUnion => {
    switch (kState.status) {
      case AuthState.HYDRATING:
        return { status: 'hydrating' };
      case AuthState.AUTHENTICATED:
        return { status: 'authenticated', user: kState.user! };
      case AuthState.REFRESHING:
        return { status: 'refreshing', user: kState.user! };
      case AuthState.ANONYMOUS:
        return { status: 'unauthenticated' };
      case AuthState.EXPIRED:
        return { status: 'unauthenticated' };
      case AuthState.ERROR:
        return { status: 'error', error: 'Authentication error' };
      default:
        return { status: 'idle' };
    }
  };

  // === STABLE SERVER SNAPSHOT (CRITICAL) ===
  const SERVER_SNAPSHOT: AuthKernelState = Object.freeze({
    status: AuthState.ANONYMOUS,
    user: null,
    version: 0
  });

  // === SINGLE SOURCE OF TRUTH ===
  const kernelState = useSyncExternalStore(
    authKernel.subscribe,
    authKernel.getState,
    () => SERVER_SNAPSHOT // ✅ FIXED: Stable reference prevents infinite loop
  );

  const state = getAuthState(kernelState);

  // === BOOTSTRAP SESSION ===
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const bootstrap = async () => {
      const currentState = authKernel.getState();
      const isPublicRoute = window.location.pathname === '/login' || 
                           window.location.pathname === '/register' ||
                           window.location.pathname === '/forgot-password';
      
      if (!isPublicRoute && currentState.status === AuthState.ANONYMOUS) {
        try {
          await authKernel.bootstrapSession();
        } catch (error) {
          console.error('Session bootstrap failed:', error);
        }
      }
    };

    bootstrap();
  }, []);

  // === CROSS-TAB SYNC ===
  React.useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'auth_event') {
        authKernel.logout();
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [router]);

  // === AUTH ACTIONS ===
  const login = async (email: string, password: string) => {
    try {
      await authKernel.login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      if (AuthError.isAuthError(error) && error.code === 'SESSION_EXPIRED') {
        await authKernel.logout();
      } else {
        toast.error(error instanceof Error ? error.message : 'Login failed');
      }
      throw error;
    }
  };

  const logout = async () => {
    await authKernel.logout();
    
    // Notify other tabs to logout
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_event', Date.now().toString());
    }
    
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const refreshSession = async () => {
    try {
      await authKernel.refreshToken();
    } catch (error) {
      console.error('Session refresh failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    state,
    user: (state.status === 'authenticated' || state.status === 'refreshing') ? state.user : null,
    loading: state.status === 'hydrating' || state.status === 'idle',
    isRefreshing: state.status === 'refreshing',
    hasAuth: state.status === 'authenticated' || state.status === 'refreshing',
    login,
    logout,
    refreshSession,
    isAuthenticated: state.status === 'authenticated',
  };

  // === HYDRATION GATE (CRITICAL) ===
  // Block rendering until auth is resolved to prevent flicker
  if (state.status === 'hydrating' || state.status === 'idle') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
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
