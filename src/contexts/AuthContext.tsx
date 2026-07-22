"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AuthError } from '@/lib/errors/AuthError';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Bootstrap session on mount
  useEffect(() => {
    bootstrapSession();
  }, []);

  const bootstrapSession = async () => {
    try {
      await checkSession();
    } finally {
      setIsBootstrapping(false);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        // Normal for unauthenticated session - just clear user state
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
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

      await checkSession();
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      if (AuthError.isAuthError(error) && error.code === 'SESSION_EXPIRED') {
        await logout();
      } else {
        toast.error(error instanceof Error ? error.message : 'Login failed');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Notify other tabs to logout (always use setItem, never removeItem)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_event', Date.now().toString());
      }
      router.push('/login');
      toast.success('Logged out successfully');
    }
  };

  // Cross-tab session sync
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'auth_event') {
        // Auth event received from another tab, logout this tab
        setUser(null);
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [router]);

  const refreshSession = async () => {
    // INTERNAL GUARD: Don't refresh if no authenticated user
    if (!user) {
      return;
    }
    
    // PREVENT RACE CONDITIONS: Only one refresh at a time
    if (isRefreshing) {
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Session expired');
      }
      await checkSession();
    } catch (error) {
      console.error('Session refresh failed:', error);
      await logout();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Tab focus refresh - prevents first-request failures after tab sleep
  useEffect(() => {
    // FIXED: Create handler with current user state to avoid stale closures
    const handleVisibilityChange = () => {
      // EXPLICIT GUARDS: Check conditions before any API calls
      if (document.visibilityState !== 'visible') {
        return;
      }
      
      // Get current user state to avoid stale closure issues
      const currentUser = user;
      if (!currentUser) {
        return;
      }
      
      // Only refresh if we have an authenticated user
      refreshSession().catch(error => {
        console.error('Tab focus refresh failed:', error);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, refreshSession]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshSession,
    isAuthenticated: !!user,
  };

  // Show app loader during bootstrap to prevent flicker
  if (isBootstrapping) {
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
