"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { sessionManager, User, SessionState } from '@/lib/auth/session-manager';
import { AuthError } from '@/lib/errors/AuthError';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(sessionManager.getState());
  const router = useRouter();

  // Subscribe to session manager state changes
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  // Bootstrap session on mount
  useEffect(() => {
    sessionManager.bootstrapSession().catch(error => {
      console.error('Session bootstrap failed:', error);
    });
  }, []);

  // Tab focus refresh - delegates to session manager
  useEffect(() => {
    const handleVisibilityChange = () => {
      sessionManager.handleVisibilityChange();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Cross-tab session sync
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'auth_event') {
        // Auth event received from another tab, logout this tab
        sessionManager.logout();
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      await sessionManager.login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      if (AuthError.isAuthError(error) && error.code === 'SESSION_EXPIRED') {
        await sessionManager.logout();
      } else {
        toast.error(error instanceof Error ? error.message : 'Login failed');
      }
      throw error;
    }
  };

  const logout = async () => {
    await sessionManager.logout();
    // Notify other tabs to logout (always use setItem, never removeItem)
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_event', Date.now().toString());
    }
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const refreshSession = async () => {
    await sessionManager.refreshSession();
  };

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    login,
    logout,
    refreshSession,
    isAuthenticated: !!state.user,
  };

  // Show app loader during bootstrap to prevent flicker
  if (state.loading && !state.user) {
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
