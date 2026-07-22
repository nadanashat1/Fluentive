"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-production';
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
    // Only redirect when auth is NOT loading AND user is NOT authenticated
    if (!loading && state.status !== 'hydrating' && state.status !== 'idle') {
      if (!isAuthenticated) {
        // Store the attempted URL for redirect after login
        const currentPath = window.location.pathname;
        if (currentPath !== redirectTo) {
          console.log('[ProtectedRoute] Redirecting to login, current path:', currentPath);
          router.push(`${redirectTo}?next=${encodeURIComponent(currentPath)}`);
        }
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
