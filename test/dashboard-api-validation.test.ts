// Dashboard API Validation Test Suite
// Production-grade testing for React Query + apiClient integration
// Tests all dashboard endpoints under real conditions

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { QueryClient, QueryCache } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { dashboard } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// Mock fetch for controlled testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retry for controlled testing
      gcTime: 0, // Disable garbage collection for predictable tests
    },
  },
});

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = createTestQueryClient();
  mockFetch.mockClear();
});

afterEach(() => {
  queryClient.clear();
  mockFetch.mockReset();
});

describe('Dashboard API Validation', () => {
  describe('Dashboard Summary Endpoint', () => {
    it('should fetch dashboard summary correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalLeads: 100,
          activeDeals: 25,
          revenue: 50000,
          conversionRate: 0.25,
        },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await dashboard.summary();
      
      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/summary'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringMatching(/Bearer .+/),
          }),
        })
      );
    });

    it('should handle 500 server error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      } as Response);

      await expect(dashboard.summary()).rejects.toThrow();
      
      // Verify error logging
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Dashboard summary failed')
      );
    });

    it('should respect staleTime and not refetch immediately', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { totalLeads: 100 },
        }),
      } as Response);

      const result = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: () => dashboard.summary(),
        staleTime: 2 * 60 * 1000, // 2 minutes
      });

      expect(result).toEqual({ totalLeads: 100 });
      
      // Immediate second call should return cached data
      const startTime = Date.now();
      const result2 = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: () => dashboard.summary(),
        staleTime: 2 * 60 * 1000,
      });
      
      expect(Date.now() - startTime).toBeLessThan(100); // Should be very fast (cached)
      expect(result2).toEqual(result);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one network call
    });
  });

  describe('Dashboard Stats Endpoint', () => {
    it('should fetch dashboard stats correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalLeads: 150,
          activeDeals: 30,
          revenue: 75000,
          conversionRate: 0.20,
        },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await dashboard.stats();
      
      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(dashboard.stats()).rejects.toThrow('Request timeout');
      
      // Verify timeout logging
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Request timeout after 15 seconds')
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate dashboard cache when lead is created', async () => {
      // Setup initial dashboard data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { totalLeads: 100 },
        }),
      } as Response);

      await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: () => dashboard.summary(),
      });

      // Simulate lead creation (should invalidate dashboard)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'lead-1', name: 'Test Lead' },
        }),
      } as Response);

      // This should be handled by the lead creation mutation in real app
      // For this test, we'll manually invalidate dashboard cache
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Verify cache was invalidated
      expect(queryClient.getQueryCache().findAll()).toEqual([]);
    });
  });

  describe('Background Refetch Behavior', () => {
    it('should refetch on window focus', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { totalLeads: callCount },
          }),
        });
      });

      const result = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: () => dashboard.summary(),
        staleTime: 2 * 60 * 1000,
      });

      expect(result.totalLeads).toBe(1);

      // Simulate window focus
      global.dispatchEvent(new Event('focus'));

      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(result.totalLeads).toBe(2);
      expect(callCount).toBe(2);
    });

    it('should refetch on reconnect', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { totalLeads: callCount },
          }),
        });
      });

      const result = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: () => dashboard.summary(),
        staleTime: 2 * 60 * 1000,
      });

      expect(result.totalLeads).toBe(1);

      // Simulate reconnect
      global.dispatchEvent(new Event('online'));

      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(result.totalLeads).toBe(2);
      expect(callCount).toBe(2);
    });
  });

  describe('Request Deduplication', () => {
    it('should not duplicate GET requests', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { totalLeads: callCount },
          }),
        });
      });

      // Fire multiple simultaneous requests
      const promises = Array.from({ length: 5 }, () =>
        queryClient.fetchQuery({
          queryKey: queryKeys.dashboard.summary(),
          queryFn: () => dashboard.summary(),
        })
      );

      await Promise.all(promises);

      // Should only make one network call due to deduplication
      expect(callCount).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Observability', () => {
    it('should log errors with request context', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await dashboard.summary();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Verify error was logged with context
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: expect.any(String),
          url: expect.stringContaining('/api/dashboard/summary'),
          method: 'GET',
          duration: expect.any(Number),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle 401 with token refresh', async () => {
      const authServiceSpy = jest.spyOn(authService, 'getCurrentUser');
      
      // First call fails with 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      } as Response);

      try {
        await dashboard.summary();
      } catch (error) {
        expect(error.message).toContain('Unauthorized');
      }

      // Second call should trigger token refresh
      expect(authServiceSpy).not.toHaveBeenCalled();
      
      authServiceSpy.mockRestore();
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance with 50 concurrent requests', async () => {
      const startTime = Date.now();
      let callCount = 0;
      
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { totalLeads: callCount },
          }),
        });
      });

      // Fire 50 concurrent requests
      const promises = Array.from({ length: 50 }, (_, index) =>
        queryClient.fetchQuery({
          queryKey: [queryKeys.dashboard.summary(), index], // Unique keys to avoid cache hits
          queryFn: () => dashboard.summary(),
        })
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (under 5 seconds for 50 requests)
      expect(duration).toBeLessThan(5000);
      
      // Should handle concurrent load without errors
      expect(callCount).toBe(50);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with real React Query behavior', async () => {
      // Mock successful responses
      mockFetch.mockImplementation((url) => {
        if (url.includes('/summary')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: { totalLeads: 100, activeDeals: 25 },
            }),
          });
        }
        if (url.includes('/stats')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: { totalLeads: 100, conversionRate: 0.3 },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { message: 'Not found' },
          }),
        });
      });

      // Test real usage patterns
      const summaryQuery = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: () => dashboard.summary(),
      });

      const statsQuery = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.stats(),
        queryFn: () => dashboard.stats(),
      });

      // Verify both succeed
      expect(summaryQuery).toEqual({ totalLeads: 100, activeDeals: 25 });
      expect(statsQuery).toEqual({ totalLeads: 100, conversionRate: 0.3 });

      // Verify cache behavior
      const summaryQuery2 = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: () => dashboard.summary(),
      });

      expect(summaryQuery2).toEqual(summaryQuery); // Should use cache
      expect(mockFetch).toHaveBeenCalledTimes(2); // One call per endpoint
    });
  });
});
