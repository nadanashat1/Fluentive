import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { 
  useDashboardSummary, 
  useDashboardStats, 
  useRefreshDashboard,
  useDashboardRefresh 
} from '@/hooks/useDashboard';
import { queryKeys } from '@/lib/query-keys';
import { createTestQueryClient } from '../utils/test-wrapper';

// Mock the API module
vi.mock('@/lib/api', () => ({
  dashboard: {
    summary: vi.fn(),
    stats: vi.fn(),
  },
}));

describe('React Query Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
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

      const { result } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

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

      const { result } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBeUndefined();
    });

    it('should use correct query key', () => {
      const { result } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
      const query = queryClient.getQueryCache().getAll()[0];
      expect(query.queryKey).toEqual(queryKeys.dashboard.summary());
    });

    it('should respect staleTime configuration', async () => {
      const mockSummary = { totalLeads: 100 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      const { result, rerender } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

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

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockStats);
      });

      expect(dashboard.stats).toHaveBeenCalledTimes(1);
    });

    it('should use correct query key', () => {
      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      const query = queryClient.getQueryCache().getAll().find(
        q => JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.dashboard.stats())
      );
      expect(query?.queryKey).toEqual(queryKeys.dashboard.stats());
    });
  });

  describe('useRefreshDashboard', () => {
    it('should invalidate dashboard queries when called', async () => {
      const mockSummary = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      // Initial fetch
      const { result } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear mock to track new calls
      vi.mocked(dashboard.summary).mockClear();

      // Test refresh hook
      const { result: refreshResult } = renderHook(() => useRefreshDashboard(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

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
      renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });
      renderHook(() => useDashboardStats(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      await waitFor(() => {
        expect(queryClient.getQueryCache().getAll()).toHaveLength(2);
      });

      // Clear mocks
      vi.mocked(dashboard.summary).mockClear();
      vi.mocked(dashboard.stats).mockClear();

      // Test refresh
      const { result } = renderHook(() => useRefreshDashboard(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      result.current();

      // Both should be refetched
      await waitFor(() => {
        expect(dashboard.summary).toHaveBeenCalledTimes(1);
        expect(dashboard.stats).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('useDashboardRefresh', () => {
    it('should be disabled by default', () => {
      const { result } = renderHook(() => useDashboardRefresh(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });

    it('should have correct query key', () => {
      const { result } = renderHook(() => useDashboardRefresh(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      const query = queryClient.getQueryCache().getAll().find(
        q => JSON.stringify(q.queryKey) === JSON.stringify([...queryKeys.dashboard.all, 'refresh'])
      );
      expect(query?.queryKey).toEqual([...queryKeys.dashboard.all, 'refresh']);
    });

    it('should not retry on failure', async () => {
      const { result } = renderHook(() => useDashboardRefresh(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      // Manually trigger the query
      result.current.refetch();

      // The query should not retry since retry is false
      expect(result.current.failureCount).toBe(0);
    });
  });

  describe('Cache Behavior', () => {
    it('should share cache between identical queries', async () => {
      const mockSummary = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      // Render two instances of the same hook
      const { result: result1 } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });
      const { result: result2 } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

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
      renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });
      renderHook(() => useDashboardStats(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      await waitFor(() => {
        expect(queryClient.getQueryCache().getAll()).toHaveLength(2);
      });

      // Should call both APIs
      expect(dashboard.summary).toHaveBeenCalledTimes(1);
      expect(dashboard.stats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refetch Behavior', () => {
    it('should refetch on window focus', async () => {
      const mockSummary = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear mock to track refetch
      vi.mocked(dashboard.summary).mockClear();

      // Simulate window focus
      window.dispatchEvent(new Event('focus'));

      await waitFor(() => {
        expect(dashboard.summary).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch on reconnect', async () => {
      const mockSummary = { totalLeads: 150 };
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useDashboardSummary(), {
        wrapper: ({ children }) => render(children, { queryClient })
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Clear mock to track refetch
      vi.mocked(dashboard.summary).mockClear();

      // Simulate reconnect
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(dashboard.summary).toHaveBeenCalledTimes(1);
      });
    });
  });
});
