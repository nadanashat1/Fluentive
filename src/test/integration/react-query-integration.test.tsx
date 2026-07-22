import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

describe('React Query Integration Tests', () => {
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

  describe('useDashboardSummary', () => {
    it('should fetch dashboard summary data successfully', async () => {
      const mockSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: [
          { id: 1, type: 'lead_created', message: 'New lead', timestamp: '2024-01-15T10:30:00Z' }
        ]
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockSummary);
      });

      expect(dashboard.summary).toHaveBeenCalledTimes(1);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle API errors correctly', async () => {
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.data).toBeUndefined();
      });
    });

    it('should use correct query key', () => {
      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      expect(queries).toHaveLength(1);
      expect(queries[0].queryKey).toEqual(queryKeys.dashboard.summary());
    });

    it('should respect staleTime configuration', async () => {
      const mockSummary = { totalLeads: 100 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      const { result, rerender } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear mock to test cache hit
      vi.mocked(dashboard.summary).mockClear();

      // Rerender - should use cache due to staleTime
      rerender();

      // Should not call API again due to cache
      expect(dashboard.summary).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(mockSummary);
    });
  });

  describe('useDashboardStats', () => {
    it('should fetch dashboard stats data successfully', async () => {
      const mockStats = {
        leadsThisMonth: 25,
        dealsWon: 8,
        averageDealSize: 15000,
        pipelineValue: 675000
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.stats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockStats);
      });

      expect(dashboard.stats).toHaveBeenCalledTimes(1);
    });

    it('should use correct query key', () => {
      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      const statsQuery = queries.find(
        q => JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.dashboard.stats())
      );
      expect(statsQuery?.queryKey).toEqual(queryKeys.dashboard.stats());
    });
  });

  describe('useRefreshDashboard', () => {
    it('should invalidate dashboard queries when called', async () => {
      const mockSummary = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      // Initial fetch
      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear mock to track new calls
      vi.mocked(dashboard.summary).mockClear();

      // Test refresh hook
      const { result: refreshResult } = renderHook(() => useRefreshDashboard(), { wrapper });

      // Call refresh function
      refreshResult.current();

      // Should invalidate and refetch
      await waitFor(() => {
        expect(dashboard.summary).toHaveBeenCalledTimes(1);
      });
    });

    it('should invalidate all dashboard queries', async () => {
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue({ totalLeads: 150 });
      vi.mocked(dashboard.stats).mockResolvedValue({ leadsThisMonth: 25 });

      // Set up both queries
      renderHook(() => useDashboardSummary(), { wrapper });
      renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(queryClient.getQueryCache().getAll()).toHaveLength(2);
      });

      // Clear mocks
      vi.mocked(dashboard.summary).mockClear();
      vi.mocked(dashboard.stats).mockClear();

      // Test refresh
      const { result } = renderHook(() => useRefreshDashboard(), { wrapper });

      result.current();

      // Both should be refetched
      await waitFor(() => {
        expect(dashboard.summary).toHaveBeenCalledTimes(1);
        expect(dashboard.stats).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Cache Behavior', () => {
    it('should share cache between identical queries', async () => {
      const mockSummary = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      // Render two instances of same hook
      const { result: result1 } = renderHook(() => useDashboardSummary(), { wrapper });
      const { result: result2 } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result1.current.data).toEqual(mockSummary);
        expect(result2.current.data).toEqual(mockSummary);
      });

      // Should only call API once due to cache sharing
      expect(dashboard.summary).toHaveBeenCalledTimes(1);
    });

    it('should not share cache between different queries', async () => {
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue({ totalLeads: 150 });
      vi.mocked(dashboard.stats).mockResolvedValue({ leadsThisMonth: 25 });

      // Render different hooks
      renderHook(() => useDashboardSummary(), { wrapper });
      renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(queryClient.getQueryCache().getAll()).toHaveLength(2);
      });

      // Should call both APIs
      expect(dashboard.summary).toHaveBeenCalledTimes(1);
      expect(dashboard.stats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Invalidation', () => {
    it('should refetch data after invalidation', async () => {
      const mockSummary1 = { totalLeads: 150 };
      const mockSummary2 = { totalLeads: 200 };
      const { dashboard } = await import('@/lib/api');
      
      // First return
      vi.mocked(dashboard.summary).mockResolvedValueOnce(mockSummary1);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary1);
      });

      // Second return after invalidation
      vi.mocked(dashboard.summary).mockResolvedValueOnce(mockSummary2);

      // Invalidate query
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary2);
      });

      expect(dashboard.summary).toHaveBeenCalledTimes(2);
    });
  });
});
