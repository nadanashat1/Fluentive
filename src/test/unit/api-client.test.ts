import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, safeFetch, ApiError } from '@/lib/api-client';
import { server } from '../mocks/server';
import { http } from 'msw';

// Mock the auth token module
vi.mock('@/lib/auth-token', () => ({
  getAuthToken: vi.fn(() => 'mock-token'),
}));

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
    console.log = vi.fn();
    
    // Reset localStorage
    localStorage.clear();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('apiFetch', () => {
    it('should make successful GET request', async () => {
      const response = await apiFetch('/dashboard/summary');
      
      expect(response).toEqual({
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: expect.any(Array),
      });
    });

    it('should include auth token in headers', async () => {
      await apiFetch('/dashboard/summary');
      
      // Verify the request was made with auth token
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[API Request] GET'),
        expect.objectContaining({ hasToken: true })
      );
    });

    it('should build correct API URL', async () => {
      await apiFetch('/dashboard/summary');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/summary'),
        expect.any(Object)
      );
    });

    it('should handle POST requests with data', async () => {
      const leadData = { name: 'Test Lead', email: 'test@example.com' };
      
      const response = await apiFetch('/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
      });
      
      expect(response).toEqual({
        id: 123,
        name: 'New Lead',
        status: 'new',
        createdAt: expect.any(String),
      });
    });

    it('should handle 401 unauthorized error', async () => {
      // Override the handler for this test
      server.use(
        http.get('/api/dashboard/summary', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ error: 'Unauthorized' })
          );
        })
      );

      await expect(apiFetch('/dashboard/summary')).rejects.toThrow(ApiError);
      
      // Verify token was cleared and redirect happened
      expect(localStorage.getItem('dfluency.token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('should handle 500 server error', async () => {
      server.use(
        http.get('/api/dashboard/summary', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Internal server error' })
          );
        })
      );

      await expect(apiFetch('/dashboard/summary')).rejects.toThrow(ApiError);
    });

    it('should handle network errors gracefully', async () => {
      // Mock fetch to simulate network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(apiFetch('/dashboard/summary')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON response', async () => {
      server.use(
        http.get('/api/dashboard/summary', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.set('Content-Type', 'application/json'),
            ctx.body('invalid json')
          );
        })
      );

      await expect(apiFetch('/dashboard/summary')).rejects.toThrow();
    });

    it('should work without auth token', async () => {
      // Mock no token
      const { getAuthToken } = await import('@/lib/auth-token');
      vi.mocked(getAuthToken).mockReturnValue(null);

      const response = await apiFetch('/dashboard/summary');
      
      expect(response).toBeDefined();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[API Request] GET'),
        expect.objectContaining({ hasToken: false })
      );
    });

    it('should handle custom headers', async () => {
      await apiFetch('/dashboard/summary', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      // The request should include custom headers
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle PUT requests', async () => {
      const updateData = { status: 'qualified' };
      
      const response = await apiFetch('/leads/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      expect(response).toEqual({
        id: 123,
        name: 'Updated Lead',
        status: 'qualified',
        updatedAt: expect.any(String),
      });
    });
  });

  describe('safeFetch', () => {
    it('should return data on successful request', async () => {
      const response = await safeFetch('/dashboard/summary');
      
      expect(response).toEqual({
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: expect.any(Array),
      });
    });

    it('should return null on API error', async () => {
      server.use(
        http.get('/api/dashboard/summary', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Internal server error' })
          );
        })
      );

      const response = await safeFetch('/dashboard/summary');
      
      expect(response).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Fetch error:', expect.any(Error));
    });

    it('should return null on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const response = await safeFetch('/dashboard/summary');
      
      expect(response).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Fetch error:', expect.any(Error));
    });

    it('should return null on 401 error', async () => {
      server.use(
        http.get('http://localhost:3000/api/dashboard/summary', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ error: 'Unauthorized' })
          );
        })
      );

      const response = await safeFetch('/dashboard/summary');
      
      expect(response).toBeNull();
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with message and status code', () => {
      const error = new ApiError('Test error', 500);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError without status code', () => {
      const error = new ApiError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBeUndefined();
      expect(error.name).toBe('ApiError');
    });
  });

  describe('URL building', () => {
    it('should handle paths with leading slash', async () => {
      await apiFetch('/dashboard/summary');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/dashboard/summary'),
        expect.any(Object)
      );
    });

    it('should handle paths without leading slash', async () => {
      await apiFetch('dashboard/summary');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/dashboard/summary'),
        expect.any(Object)
      );
    });

    it('should use custom API base URL from environment', async () => {
      const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      
      // Re-import the module to get the new environment variable
      delete require.cache[require.resolve('@/lib/api-client')];
      const { apiFetch: apiFetchWithCustomUrl } = await import('@/lib/api-client');
      
      await apiFetchWithCustomUrl('/dashboard/summary');
      
      // Restore original
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    });
  });
});
