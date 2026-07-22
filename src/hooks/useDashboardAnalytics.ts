"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardMetrics } from '@/lib/dashboard/dashboard-data-layer';

export const DASHBOARD_QUERY_KEY = ['dashboard', 'summary'];

export function useDashboardAnalytics(range: string = '7d') {
  const queryClient = useQueryClient();

  const query = useQuery<DashboardMetrics>({
    queryKey: [...DASHBOARD_QUERY_KEY, range],
    queryFn: () => dashboardService.getSummary(range),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  };

  return {
    ...query,
    invalidateDashboard
  };
}
