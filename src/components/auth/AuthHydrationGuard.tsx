import React from 'react';
import { useAuth } from '@/contexts/AuthContext-production';

interface AuthHydrationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Auth Hydration Guard - Prevents rendering app content until auth is resolved
 * This fixes the race condition where API calls are made before cookies are available
 */
export function AuthHydrationGuard({ children, fallback }: AuthHydrationGuardProps) {
  const { loading } = useAuth();

  // Show loading screen while auth is hydrating or not bootstrapped
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Auth Ready Guard - Ensures user is authenticated before rendering protected content
 */
export function AuthReadyGuard({ children, fallback }: AuthHydrationGuardProps) {
  const { isAuthenticated, state } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;

  // Show fallback or nothing while not authenticated
  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  return <>{children}</>;
}
