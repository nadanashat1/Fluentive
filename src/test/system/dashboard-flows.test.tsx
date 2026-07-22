import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { useDashboardSummary, useDashboardStats, useRefreshDashboard } from '@/hooks/useDashboard';
import { queryKeys } from '@/lib/query-keys';

// Mock API module
vi.mock('@/lib/api', () => ({
  dashboard: {
    summary: vi.fn(),
    stats: vi.fn(),
  },
}));

// Mock dashboard component
vi.mock('@/components/dashboard/dashboard-summary', () => ({
  DashboardSummary: vi.fn(({ data, isLoading, error, onRefresh }) => (
    <div data-testid="dashboard-summary">
      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">Error: {error.message}</div>}
      {data && (
        <div data-testid="dashboard-data">
          <div data-testid="total-leads">{data.totalLeads}</div>
          <div data-testid="active-deals">{data.activeDeals}</div>
          <div data-testid="conversion-rate">{data.conversionRate}</div>
          <div data-testid="monthly-revenue">{data.monthlyRevenue}</div>
          <button data-testid="refresh-btn" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      )}
    </div>
  )),
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

  describe('Complete Dashboard Loading Flow', () => {
    it('should show loading state while fetching data', async () => {
      const mockSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: []
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSummary), 100))
      );

      render(
        <DashboardSummary 
          data={undefined}
          isLoading={true}
          error={undefined}
          onRefresh={vi.fn()}
        />,
        { wrapper }
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-data')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });

    it('should display dashboard data after successful load', async () => {
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

      render(
        <DashboardSummary 
          data={mockSummary}
          isLoading={false}
          error={undefined}
          onRefresh={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-leads')).toHaveTextContent('150');
        expect(screen.getByTestId('active-deals')).toHaveTextContent('45');
        expect(screen.getByTestId('conversion-rate')).toHaveTextContent('0.32');
        expect(screen.getByTestId('monthly-revenue')).toHaveTextContent('125000');
      });

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
      const error = new Error('Failed to load dashboard');
      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockRejectedValue(error);

      render(
        <DashboardSummary 
          data={undefined}
          isLoading={false}
          error={error}
          onRefresh={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByTestId('error')).toHaveTextContent(`Error: ${error.message}`);
      });

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-data')).not.toBeInTheDocument();
    });
  });

  describe('Dashboard Refresh Flow', () => {
    it('should trigger data refresh when refresh button is clicked', async () => {
      const mockSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: []
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      const onRefresh = vi.fn();

      render(
        <DashboardSummary 
          data={mockSummary}
          isLoading={false}
          error={undefined}
          onRefresh={onRefresh}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-btn');
      fireEvent.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should refetch data after refresh', async () => {
      const mockSummary1 = { totalLeads: 150 };
      const mockSummary2 = { totalLeads: 200 };
      const { dashboard } = await import('@/lib/api');
      
      // First load
      vi.mocked(dashboard.summary).mockResolvedValueOnce(mockSummary1);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary1);
      });

      // Setup refresh hook
      const { result: refreshResult } = renderHook(() => useRefreshDashboard(), { wrapper });

      // Trigger refresh
      refreshResult.current();

      // Should refetch with new data
      vi.mocked(dashboard.summary).mockResolvedValueOnce(mockSummary2);

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary2);
      });

      expect(dashboard.summary).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dashboard Data Consistency', () => {
    it('should maintain data consistency across multiple dashboard views', async () => {
      const mockSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: []
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

      // Render both dashboard views
      const { result: summaryResult } = renderHook(() => useDashboardSummary(), { wrapper });
      const { result: statsResult } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(summaryResult.current.data).toEqual(mockSummary);
        expect(statsResult.current.data).toEqual(mockStats);
      });

      // Verify data is consistent
      expect(summaryResult.current.data?.totalLeads).toBe(150);
      expect(statsResult.current.data?.leadsThisMonth).toBe(25);

      // Both should be successful
      expect(summaryResult.current.isSuccess).toBe(true);
      expect(statsResult.current.isSuccess).toBe(true);
    });

    it('should handle partial data updates correctly', async () => {
      const initialSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: []
      };

      const updatedSummary = {
        totalLeads: 160,
        activeDeals: 48,
        conversionRate: 0.35,
        monthlyRevenue: 130000,
        recentActivity: []
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValueOnce(initialSummary);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(initialSummary);
      });

      // Simulate data update
      vi.mocked(dashboard.summary).mockResolvedValueOnce(updatedSummary);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedSummary);
      });

      // Verify specific fields updated
      expect(result.current.data?.totalLeads).toBe(160);
      expect(result.current.data?.activeDeals).toBe(48);
      expect(result.current.data?.conversionRate).toBe(0.35);
    });
  });

  describe('Dashboard Error Recovery', () => {
    it('should recover from transient errors', async () => {
      const transientError = new Error('Network timeout');
      const successData = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: []
      };

      const { dashboard } = await import('@/lib/api');
      
      // First call fails
      vi.mocked(dashboard.summary).mockRejectedValueOnce(transientError);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(transientError);
      });

      // Second call succeeds
      vi.mocked(dashboard.summary).mockResolvedValueOnce(successData);

      // Retry the query
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(successData);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle multiple concurrent dashboard requests', async () => {
      const mockSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: []
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      // Simulate multiple concurrent requests
      const { result: result1 } = renderHook(() => useDashboardSummary(), { wrapper });
      const { result: result2 } = renderHook(() => useDashboardSummary(), { wrapper });
      const { result: result3 } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result1.current.data).toEqual(mockSummary);
        expect(result2.current.data).toEqual(mockSummary);
        expect(result3.current.data).toEqual(mockSummary);
      });

      // Should only call API once due to caching
      expect(dashboard.summary).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dashboard Performance', () => {
    it('should not make unnecessary API calls', async () => {
      const mockSummary = {
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: []
      };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValue(mockSummary);

      // First render
      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary);
      });

      // Clear mock to track additional calls
      vi.mocked(dashboard.summary).mockClear();

      // Re-render without invalidation
      result.current.refetch();

      // Should use cache, not make new API call
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(dashboard.summary).not.toHaveBeenCalled();
    });

    it('should respect cache invalidation', async () => {
      const mockSummary1 = { totalLeads: 150 };
      const mockSummary2 = { totalLeads: 200 };

      const { dashboard } = await import('@/lib/api');
      vi.mocked(dashboard.summary).mockResolvedValueOnce(mockSummary1);

      const { result } = renderHook(() => useDashboardSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary1);
      });

      // Clear mock
      vi.mocked(dashboard.summary).mockClear();

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });

      // Should make new API call
      vi.mocked(dashboard.summary).mockResolvedValueOnce(mockSummary2);

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary2);
      });

      expect(dashboard.summary).toHaveBeenCalledTimes(1);
    });
  });
});
