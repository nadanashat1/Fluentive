"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-production';
import { authKernel, AuthState } from '@/lib/auth/auth-kernel';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { state, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only act when auth is NOT loading AND not mid-hydration
    if (!loading && state.status !== 'hydrating' && state.status !== 'idle') {
      if (!isAuthenticated) {
        // Attempt a session bootstrap BEFORE redirecting. On a cold load the
        // kernel starts ANONYMOUS and child effects run before the provider's
        // bootstrap effect, which bounced users with a valid session straight
        // to /login. bootstrapSession() is idempotent (internal guards) and
        // flips status to HYDRATING synchronously when it actually runs; when
        // it resolves we re-check the kernel and only then redirect.
        let cancelled = false;
        Promise.resolve(authKernel.bootstrapSession()).then(() => {
          if (cancelled) return;
          const s = authKernel.getState();
          if (s.status !== AuthState.AUTHENTICATED && s.status !== AuthState.REFRESHING) {
            const currentPath = window.location.pathname;
            if (currentPath !== redirectTo) {
              console.log('[ProtectedRoute] Redirecting to login, current path:', currentPath);
              router.push(`${redirectTo}?next=${encodeURIComponent(currentPath)}`);
            }
          }
        });
        return () => { cancelled = true; };
      } else {
        console.log('[ProtectedRoute] User authenticated, allowing access');
      }
    }
  }, [loading, state.status, isAuthenticated, router, redirectTo]);

  // Show loading state during hydration or loading
  if (loading || state.status === 'hydrating' || state.status === 'idle') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render nothing (redirect will happen)
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, rendering null');
    return null;
  }

  // User is authenticated, render children
  console.log('[ProtectedRoute] Authenticated, rendering children');
  return <>{children}</>;
}
