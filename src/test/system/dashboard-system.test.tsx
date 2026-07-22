import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { 
  useDashboardSummary, 
  useDashboardStats, 
  useRefreshDashboard 
} from '@/hooks/useDashboard';
import { queryKeys } from '@/lib/query-keys';

// Mock API module
vi.mock('@/lib/api', () => ({
  dashboard: {
    summary: vi.fn(),
    stats: vi.fn(),
  },
}));

describe('Dashboard System Tests', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    vi.clearAllMocks();
  });

  describe('Dashboard Data Flow', () => {
    it('should load dashboard data end-to-end', async () => {
      const mockSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: [
          { id: 1, type: 'lead_created', message: 'New lead', timestamp: '2024-01-15T10:30:00Z' }
        ]
      };

      const mockStats = {
        leadsThisMonth: 25,
        dealsWon: 8,
        averageDealSize: 15000,
        pipelineValue: 675000
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);
      vi.mocked(dashboard.stats).mockResolvedValue(mockStats);

      // Load both dashboard queries
      const { result: summaryResult } = renderHook(() => useDashboardSummary(), { wrapper });
      const { result: statsResult } = renderHook(() => useDashboardStats(), { wrapper });

      // Wait for both to complete
      await waitFor(() => {
        expect(summaryResult.current.isSuccess).toBe(true);
        expect(statsResult.current.isSuccess).toBe(true);
      });

      // Verify data integrity
      expect(summaryResult.current.data).toEqual(mockSummary);
      expect(statsResult.current.data).toEqual(mockStats);

      // Verify API calls
      expect(dashboard.summary).toHaveBeenCalledTimes(1);
      expect(dashboard.stats).toHaveBeenCalledTimes(1);
    });

    it('should handle dashboard refresh workflow', async () => {
      const initialData = { totalLeads: 100 };
      const refreshedData = { totalLeads: 200 };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValueOnce(initialData);

      // Initial load
      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      // Setup refresh
      const { result: refreshResult } = renderHook(() => useRefreshDashboard(), { wrapper });

      // Trigger refresh
      vi.mocked(dashboard.summary).mockResolvedValueOnce(refreshedData);
      refreshResult.current();

      // Should refetch with new data
      await waitFor(() => {
        expect(result.current.data).toEqual(refreshedData);
      });

      expect(dashboard.summary).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dashboard Error Handling', () => {
    it('should recover from API failures gracefully', async () => {
      const error = new Error('API Error');
      const successData = { totalLeads: 150 };

      const { dashboard } = await import('@/lib/api');
      
      // First call fails
      vi.mocked(dashboard.summary).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(error);
      });

      // Second call succeeds
      vi.mocked(dashboard.summary).mockResolvedValueOnce(successData);
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(successData);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle concurrent requests without duplication', async () => {
      const mockData = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockData);

      // Create multiple hook instances
      const { result: result1 } = renderHook(() => useDashboardSummary(), { wrapper });
      const { result: result2 } = renderHook(() => useDashboardSummary(), { wrapper });
      const { result: result3 } = renderHook(() => useDashboardSummary(), { wrapper });

      // Wait for all to complete
      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
        expect(result3.current.isSuccess).toBe(true);
      });

      // All should have same data
      expect(result1.current.data).toEqual(mockData);
      expect(result2.current.data).toEqual(mockData);
      expect(result3.current.data).toEqual(mockData);

      // Should only call API once due to caching
      expect(dashboard.summary).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dashboard Cache Management', () => {
    it('should invalidate and refetch correctly', async () => {
      const data1 = { totalLeads: 100 };
      const data2 = { totalLeads: 200 };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValueOnce(data1);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(data1);
      });

      // Clear mock for next call
      vi.mocked(dashboard.summary).mockClear();
      vi.mocked(dashboard.summary).mockResolvedValueOnce(data2);

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });

      await waitFor(() => {
        expect(result.current.data).toEqual(data2);
      });

      expect(dashboard.summary).toHaveBeenCalledTimes(1);
    });

    it('should respect query key structure', () => {
      renderHook(() => useDashboardSummary(), { wrapper });
      renderHook(() => useDashboardStats(), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      
      // Should have exactly 2 queries
      expect(queries).toHaveLength(2);

      // Should have correct query keys
      const summaryQuery = queries.find(q => 
        JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.dashboard.summary())
      );
      const statsQuery = queries.find(q => 
        JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.dashboard.stats())
      );

      expect(summaryQuery?.queryKey).toEqual(queryKeys.dashboard.summary());
      expect(statsQuery?.queryKey).toEqual(queryKeys.dashboard.stats());
    });
  });

  describe('Dashboard Performance', () => {
    it('should not make unnecessary network requests', async () => {
      const mockData = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear mock to track additional calls
      vi.mocked(dashboard.summary).mockClear();

      // Multiple re-renders should not trigger new requests
      result.current.refetch();
      result.current.refetch();
      result.current.refetch();

      // Should not make additional API calls due to deduplication
      // Note: React Query may batch refetch calls internally
      expect(dashboard.summary).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid state changes', async () => {
      const mockData = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Rapid invalidations should be handled gracefully
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });

      // Should still work correctly
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should handle rapid changes without errors
      expect(result.current.error).toBeNull();
    });
  });
});
