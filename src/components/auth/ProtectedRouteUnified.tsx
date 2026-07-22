"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-production';
import { hasPermission, PERMISSIONS, Permission } from '@/lib/permissions/index';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requirePermission?: Permission;
  requireAnyPermission?: Permission[];
  requireAllPermissions?: Permission[];
}

export function ProtectedRouteUnified({ 
  children, 
  fallback, 
  redirectTo = '/login',
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
}: ProtectedRouteProps) {
  const { state, loading, isAuthenticated } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
      
      // Check authentication first
      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        if (currentPath !== redirectTo) {
          router.push(`${redirectTo}?next=${encodeURIComponent(currentPath)}`);
        }
        return;
      }

      // Check permissions if user is authenticated
      if (user && (requirePermission || requireAnyPermission || requireAllPermissions)) {
        let hasRequiredPermission = true;

        if (requirePermission) {
          hasRequiredPermission = hasPermission(user.role, requirePermission);
        } else if (requireAnyPermission) {
          hasRequiredPermission = requireAnyPermission.some(perm => hasPermission(user.role, perm));
        } else if (requireAllPermissions) {
          hasRequiredPermission = requireAllPermissions.every(perm => hasPermission(user.role, perm));
        }

        if (!hasRequiredPermission) {
          router.push('/dashboard'); // Redirect to dashboard on permission denied
          return;
        }
      }
    }
  }, [loading, isAuthenticated, user, router, redirectTo, requirePermission, requireAnyPermission, requireAllPermissions]);

  // Show loading state while checking auth
  if (loading || isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Check permissions again for safety
  if (user && (requirePermission || requireAnyPermission || requireAllPermissions)) {
    let hasRequiredPermission = true;

    if (requirePermission) {
      hasRequiredPermission = hasPermission(user.role, requirePermission);
    } else if (requireAnyPermission) {
      hasRequiredPermission = requireAnyPermission.some(perm => hasPermission(user.role, perm));
    } else if (requireAllPermissions) {
      hasRequiredPermission = requireAllPermissions.every(perm => hasPermission(user.role, perm));
    }

    if (!hasRequiredPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-4 text-6xl">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand/90"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

// Convenience wrappers for common use cases
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requirePermission'>) {
  return (
    <ProtectedRouteUnified requirePermission={PERMISSIONS.USERS_MANAGE} {...props}>
      {children}
    </ProtectedRouteUnified>
  );
}

export function ManagerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAnyPermission'>) {
  return (
    <ProtectedRouteUnified 
      requireAnyPermission={[
        PERMISSIONS.LEADS_MANAGE,
        PERMISSIONS.DEALS_MANAGE,
        PERMISSIONS.ORG_INVITE
      ]} 
      {...props}
    >
      {children}
    </ProtectedRouteUnified>
  );
}
