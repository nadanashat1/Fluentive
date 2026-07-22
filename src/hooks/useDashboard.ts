// React Query hooks for Dashboard
// Clean data lifecycle management with type-safe typed API

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { typedApi } from '@/services/typed-api.service';
import { queryKeys } from '@/lib/query-keys';

// Hook for dashboard summary
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => typedApi.dashboard.summary(),
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes moderately
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh when connection restored
    retry: 1, // Retry once on failure
  });
}

// Hook for dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => typedApi.dashboard.stats(),
    staleTime: 5 * 60 * 1000, // 5 minutes - stats change less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh when connection restored
    retry: 1, // Retry once on failure
  });
}

// Hook for refreshing dashboard data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    // Invalidate all dashboard queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

// Hook for manual dashboard refresh (user-triggered)
export function useDashboardRefresh() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'refresh'],
    queryFn: async () => {
      // Force refresh all dashboard data
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      return { refreshed: true };
    },
    enabled: false, // Manual trigger only
    retry: false,
  });
}
