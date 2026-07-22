'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useQueryErrorBoundary } from '@/components/error-boundary';
import type { ActivityLogsFilters, ActivityLogsResponse } from '@/lib/activity-logs/types';

function buildActivityLogsQuery(filters: ActivityLogsFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.severity && filters.severity !== 'all') {
    params.set('severity', filters.severity);
  }
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.ip) params.set('ip', filters.ip);
  if (filters.organizationId) params.set('organizationId', filters.organizationId);
  if (filters.errorsOnly) params.set('errorsOnly', 'true');
  if (filters.includeNoise) params.set('includeNoise', 'true');

  const qs = params.toString();
  return qs ? `/api/activity-logs?${qs}` : '/api/activity-logs';
}

async function fetchActivityLogs(
  filters: ActivityLogsFilters = {}
): Promise<ActivityLogsResponse> {
  return apiFetch<ActivityLogsResponse>(buildActivityLogsQuery(filters));
}

/** React Query wrapper — same `/api/activity-logs` flow, enriched response. */
export function useActivityLogs(filters: ActivityLogsFilters = {}) {
  const { withErrorBoundary } = useQueryErrorBoundary();

  return useQuery<ActivityLogsResponse, Error>(
    withErrorBoundary({
      queryKey: queryKeys.activityLogs.list(filters as Record<string, unknown>),
      queryFn: () => fetchActivityLogs(filters),
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    })
  );
}

export { buildActivityLogsQuery, fetchActivityLogs };
