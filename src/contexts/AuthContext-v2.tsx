"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authKernel } from '@/lib/auth/auth-kernel';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getNormalizedUser } from '@/lib/ui-user-utils';
import toast from 'react-hot-toast';
import type { User, AuthState, AuthKernelState } from '@/types/auth.types';

// === SNAPSHOT TYPE ===
interface AuthSnapshot {
  status: AuthState;
  user: User | null;
  version: number;
}

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  loading: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  isLoadingAuth: boolean; // ✅ NEW: Stable loading state to prevent redirects
  bootstrapped: boolean; // ✅ NEW: Bootstrap completion guard
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// === STABLE SNAPSHOT FUNCTIONS (defined OUTSIDE the component) ===
const getAuthSnapshot = (): AuthSnapshot => authKernel.getState();

const SERVER_SNAPSHOT: AuthSnapshot = Object.freeze({
  status: 'anonymous' as AuthState,
  user: null,
  version: 0,
});

const getServerSnapshot = (): AuthSnapshot => SERVER_SNAPSHOT;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // === CLEAN AUTH KERNEL SUBSCRIPTION ===
  const [authState, setAuthState] = React.useState<AuthState>('anonymous');
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true); // ✅ NEW: Stable loading state
  const [bootstrapped, setBootstrapped] = React.useState(false); // ✅ NEW: Bootstrap completion guard
  
  // ✅ CRITICAL: Prevent React StrictMode double execution & re-entrant bootstrap
  const hasBootstrappedRef = React.useRef(false);
  const meRequestInFlightRef = React.useRef(false); // ✅ NEW: Prevent duplicate /me calls
  // ✅ REMOVED: bootstrapInFlightRef - now handled at kernel level for persistence

  React.useEffect(() => {
    const unsubscribe = authKernel.subscribe(() => {
      const currentState = authKernel.getState();
      setAuthState(currentState.status);
      setUser(currentState.user);
      
      // ✅ CRITICAL: Set loading to false only after first successful state AND bootstrapped
      if (currentState.status !== 'hydrating' && bootstrapped) {
        setIsLoadingAuth(false);
      }
    });
    return unsubscribe;
  }, [bootstrapped]);

  // === DERIVED STATE ===
  const loading = authState === 'hydrating';
  const isRefreshing = authState === 'refreshing';
  const isAuthenticated = authState === 'authenticated';

  // === BOOTSTRAP SESSION WITH KERNEL-LEVEL GUARDS ===
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentState = authKernel.getState();
    const isPublicRoute = typeof window !== 'undefined' && (
      window.location.pathname === '/login' || 
      window.location.pathname === '/register' ||
      window.location.pathname === '/forgot-password'
    );
    
    // ✅ CRITICAL: Only bootstrap if not already loading and not authenticated
    if (!isPublicRoute && (currentState.status === 'anonymous' || currentState.status === 'hydrating')) {
      console.log('[AuthContext] Bootstrapping session, current state:', currentState.status);
      
      // ✅ CRITICAL: AuthKernel now handles its own guards - no need for component-level guards
      authKernel.bootstrapSession()
        .then(() => {
          console.log('[AuthContext] Bootstrap completed successfully');
          setBootstrapped(true);
        })
        .catch(error => {
          console.error('Session bootstrap failed:', error);
          setBootstrapped(true); // ✅ Still mark as bootstrapped even on error
        });
    }
  }, []); // ✅ IMPORTANT: Empty dependency array - run only on mount

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
  const login = useCallback(async (email: string, password: string) => {
    try {
      // ✅ CRITICAL: Set loading state to prevent redirects during login
      setIsLoadingAuth(true);
      
      await authKernel.login(email, password);
      
      // ✅ FIXED: No need for bootstrapSession() - authKernel.login() already sets user state
      // The double call was causing 401 race condition
      
      // ✅ CRITICAL: Set bootstrapped to true since login provides complete state
      setBootstrapped(true);
      
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
    // ✅ CRITICAL: Removed finally block - isLoadingAuth will be set to false in subscription effect
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authKernel.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [router]);

  const contextValue: AuthContextType = useMemo(() => ({
    user: getNormalizedUser(user),
    authState,
    loading,
    isRefreshing,
    isAuthenticated,
    isLoadingAuth, // ✅ NEW: Add stable loading state
    bootstrapped, // ✅ NEW: Add bootstrap completion guard
    login,
    logout
  }), [user, authState, loading, isRefreshing, isAuthenticated, isLoadingAuth, bootstrapped, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
