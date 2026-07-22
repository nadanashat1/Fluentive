"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authKernel, AuthState, User } from '@/lib/auth/auth-kernel';
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

  // === PURE SNAPSHOT FROM SINGLE AUTHORITY ===
  const getAuthSnapshot = () => {
    const kernelState = authKernel.getState();
    
    // ✅ DEBUG: Verify snapshot stability
    console.log('[AUTH] getAuthSnapshot called, state:', kernelState.status);
    
    return {
      user: kernelState.user,
      authState: kernelState.status,
      loading: kernelState.status === AuthState.HYDRATING,
      isRefreshing: kernelState.status === AuthState.REFRESHING,
      isAuthenticated: kernelState.status === AuthState.AUTHENTICATED
    };
  };

  // ✅ CACHED SERVER SNAPSHOT TO PREVENT INFINITE LOOP
  const serverSnapshot = {
    user: null as User | null,
    authState: 'anonymous' as AuthState,
    loading: true,
    isRefreshing: false,
    isAuthenticated: false
  };

  // === SINGLE SOURCE OF TRUTH ===
  const snapshot = useSyncExternalStore(
    authKernel.subscribe,
    getAuthSnapshot,
    () => serverSnapshot // Cached server-side rendering fallback
  );

  // === BOOTSTRAP SESSION ===
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // ✅ CRITICAL GUARD: Only bootstrap if not already authenticated AND not on public routes
    const currentState = authKernel.getState();
    const isPublicRoute = typeof window !== 'undefined' && (
      window.location.pathname === '/login' || 
      window.location.pathname === '/register' ||
      window.location.pathname === '/forgot-password'
    );
    
    if (!isPublicRoute && (currentState.status === 'anonymous' || currentState.status === 'hydrating')) {
      authKernel.bootstrapSession().catch(error => {
        console.error('Session bootstrap failed:', error);
      });
    }
  }, []);

  // === CROSS-TAB SYNC ===
  React.useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'auth_event') {
        // Auth event received from another tab
        authKernel.logout();
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [router]);

  // === AUTH ACTIONS (DELEGATED TO KERNEL) ===
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
