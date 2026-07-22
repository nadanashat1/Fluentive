import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, safeFetch, ApiError } from '@/lib/api-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
    
    // Set development mode to trigger console.error in safeFetch
    vi.stubEnv('NODE_ENV', 'development');
    
    // Reset localStorage
    localStorage.clear();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
      },
      writable: true,
    });

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        totalLeads: 150,
        activeDeals: 45,
        conversionRate: 0.32,
        monthlyRevenue: 125000,
        recentActivity: [
          { id: 1, type: 'lead_created', message: 'New lead from John Doe', timestamp: '2024-01-15T10:30:00Z' }
        ]
      })
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
        recentActivity: [
          { id: 1, type: 'lead_created', message: 'New lead from John Doe', timestamp: '2024-01-15T10:30:00Z' }
        ]
      });
    });

    it('should include auth token in headers', async () => {
      await apiFetch('/dashboard/summary');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/dashboard/summary',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    it('should build correct API URL', async () => {
      await apiFetch('/dashboard/summary');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/dashboard/summary',
        expect.any(Object)
      );
    });

    it('should handle POST requests with data', async () => {
      const leadData = { name: 'Test Lead', email: 'test@example.com' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          id: 123,
          name: 'New Lead',
          status: 'new',
          createdAt: new Date().toISOString()
        })
      });

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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      });

      await expect(apiFetch('/dashboard/summary')).rejects.toThrow(ApiError);
      
      // Verify token was cleared and redirect happened
      expect(localStorage.getItem('dfluency.token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal server error')
      });

      await expect(apiFetch('/dashboard/summary')).rejects.toThrow(ApiError);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiFetch('/dashboard/summary')).rejects.toThrow('Network error');
    });

    it('should work without auth token', async () => {
      // Mock no token
      const { getAuthToken } = await import('@/lib/auth-token');
      vi.mocked(getAuthToken).mockReturnValue(null);

      await apiFetch('/dashboard/summary');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/dashboard/summary',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('should handle PUT requests', async () => {
      const updateData = { status: 'qualified' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          id: 123,
          name: 'Updated Lead',
          status: 'qualified',
          updatedAt: new Date().toISOString()
        })
      });

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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal server error')
      });

      const response = await safeFetch('/dashboard/summary');
      
      expect(response).toBeNull();
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await safeFetch('/dashboard/summary');
      
      expect(response).toBeNull();
    });

    it('should return null on 401 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      });

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
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/dashboard/summary',
        expect.any(Object)
      );
    });

    it('should handle paths without leading slash', async () => {
      await apiFetch('dashboard/summary');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/dashboard/summary',
        expect.any(Object)
      );
    });
  });
});
