// React Query hooks for Authentication
// Clean data lifecycle management with our failure-resilient apiClient

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { User, LoginResponse } from '@/lib/schemas';
import { queryKeys } from '@/lib/query-keys';
import { useQueryErrorBoundary } from '@/components/error-boundary';

// Hook for getting current user
export function useAuthUser() {
  const { withErrorBoundary } = useQueryErrorBoundary();
  
  return useQuery(withErrorBoundary({
    queryKey: queryKeys.auth.user(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 15 * 60 * 1000, // 15 minutes - user data changes very infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache time to reduce API calls
    enabled: !!localStorage.getItem('token'), // Only run if we have a token
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh when connection restored
    refetchInterval: false, // Don't auto-refresh on interval (manual refresh only)
  }));
}

// Hook for login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse, Error, { email: string; password: string; rememberMe?: boolean }>({
    mutationFn: (data: { email: string; password: string; rememberMe?: boolean }) => 
      authService.login(data),
    onSuccess: (data: LoginResponse) => {
      // Store tokens
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (data.success && data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });

      // Clear any cached data that might be stale
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

// Hook for register mutation
export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse, Error, { name: string; email: string; password: string }>({
    mutationFn: (data: { name: string; email: string; password: string }) => 
      authService.register(data),
    onSuccess: (data: LoginResponse) => {
      // Store tokens
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (data.success && data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
      
      // Clear any cached data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
}

// Hook for logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear token
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Clear all cached data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      
      // Redirect to login (handled by component)
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still clear token and cache even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

// Hook for password change mutation
export function useChangePassword() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      authService.changePassword(data),
    onSuccess: () => {
      // Invalidate user data as it might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
    },
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });
}
