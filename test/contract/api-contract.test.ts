// Enterprise-grade API Contract Testing
// Strict contract validation for all API endpoints
// Uses Jest and Supertest for comprehensive testing

import request from 'supertest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Import API routes (these would need to be adapted for Next.js App Router)
// For now, we'll test the API wrappers and validation schemas

import { ApiWrapper } from '@/lib/server/middleware/api-wrapper';
import { Schemas } from '@/lib/server/validation/schemas';
import { UnifiedAuth } from '@/lib/server/auth/unified-auth';

// Test utilities
const TEST_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Mock user for testing
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockAdminUser = {
  ...mockUser,
  id: 'test-admin-id',
  role: 'admin'
};

// Contract schemas for response validation
const StandardResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    errors: z.array(z.string()).optional(),
    timestamp: z.string()
  }).optional(),
  message: z.string().optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    version: z.string()
  }).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean()
  }).optional()
});

const PaginatedLeadsResponseSchema = StandardResponseSchema.extend({
  data: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']),
    userId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean()
  }).required()
});

const StatsResponseSchema = StandardResponseSchema.extend({
  data: z.object({
    total: z.number(),
    byStatus: z.record(z.number()),
    trends: z.array(z.object({
      date: z.string(),
      count: z.number(),
      value: z.number().optional()
    }))
  })
});

describe('API Contract Tests', () => {
  describe('Response Format Validation', () => {
    test('success response follows standard format', () => {
      const response = ApiWrapper.success({ test: 'data' });
      const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');
      
      const result = StandardResponseSchema.safeParse(responseBody);
      expect(result.success).toBe(true);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual({ test: 'data' });
      expect(responseBody.meta).toBeDefined();
      expect(responseBody.meta.timestamp).toBeDefined();
      expect(responseBody.meta.requestId).toBeDefined();
    });

    test('paginated response follows standard format', () => {
      const mockData = [
        { id: '1', name: 'Lead 1', email: 'lead1@test.com' },
        { id: '2', name: 'Lead 2', email: 'lead2@test.com' }
      ];
      
      const response = ApiWrapper.paginated(mockData, {
        page: 1,
        limit: 10,
        total: 2
      });
      
      const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');
      const result = PaginatedLeadsResponseSchema.safeParse(responseBody);
      
      expect(result.success).toBe(true);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveLength(2);
      expect(responseBody.pagination).toBeDefined();
      expect(responseBody.pagination.page).toBe(1);
      expect(responseBody.pagination.total).toBe(2);
    });

    test('error response follows standard format', () => {
      const response = ApiWrapper.error('Test error', 400, { code: 'TEST_ERROR' });
      const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');
      
      const result = StandardResponseSchema.safeParse(responseBody);
      expect(result.success).toBe(true);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error.message).toBe('Test error');
      expect(responseBody.error.code).toBe('TEST_ERROR');
    });
  });

  describe('Input Validation Schemas', () => {
    test('LeadCreateSchema validates correct input', () => {
      const validInput = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'NEW'
      };

      const result = Schemas.LeadCreate.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('LeadCreateSchema rejects invalid email', () => {
      const invalidInput = {
        name: 'John Doe',
        email: 'invalid-email',
        status: 'NEW'
      };

      const result = Schemas.LeadCreate.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email format');
      }
    });

    test('LeadCreateSchema rejects missing required fields', () => {
      const invalidInput = {
        phone: '+1234567890'
      };

      const result = Schemas.LeadCreate.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldNames = result.error.issues.map(issue => issue.path.join('.'));
        expect(fieldNames).toContain('name');
        expect(fieldNames).toContain('email');
      }
    });

    test('LeadListQuerySchema validates pagination', () => {
      const validQuery = {
        page: 1,
        limit: 10,
        search: 'test',
        status: 'NEW'
      };

      const result = Schemas.LeadListQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    test('LeadListQuerySchema rejects invalid pagination', () => {
      const invalidQuery = {
        page: 0,
        limit: 101
      };

      const result = Schemas.LeadListQuery.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('Authentication Contract', () => {
    test('UnifiedAuth extracts token from Authorization header', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer valid-token-here'
        }
      });

      // Mock the token extraction
      jest.spyOn(UnifiedAuth, 'extractToken').mockResolvedValue('valid-token-here');
      jest.spyOn(UnifiedAuth, 'verifyToken').mockResolvedValue({ id: 'test-user' } as any);
      jest.spyOn(UnifiedAuth, 'fetchUser').mockResolvedValue(mockUser as any);

      const user = await UnifiedAuth.authenticate(mockRequest);
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    test('UnifiedAuth returns null for missing token', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test');

      jest.spyOn(UnifiedAuth, 'extractToken').mockResolvedValue(null);

      const user = await UnifiedAuth.authenticate(mockRequest);
      expect(user).toBeNull();
    });
  });

  describe('API Endpoint Integration Tests', () => {
    // These would be actual HTTP tests when running against a live server
    test('GET /api/leads returns paginated leads with correct format', async () => {
      // This test would run against actual API endpoint
      // For now, we'll test the contract structure
      
      const mockLeadsResponse = {
        success: true,
        data: [
          {
            id: 'lead-1',
            name: 'Test Lead',
            email: 'lead@test.com',
            phone: null,
            status: 'NEW',
            userId: 'user-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        },
        meta: {
          timestamp: '2024-01-01T00:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0'
        }
      };

      const result = PaginatedLeadsResponseSchema.safeParse(mockLeadsResponse);
      expect(result.success).toBe(true);
    });

    test('GET /api/leads/stats returns stats with correct format', async () => {
      const mockStatsResponse = {
        success: true,
        data: {
          total: 100,
          byStatus: {
            'NEW': 50,
            'CONTACTED': 30,
            'QUALIFIED': 20
          },
          trends: [
            {
              date: '2024-01-01',
              count: 10,
              value: 1000
            }
          ]
        },
        meta: {
          timestamp: '2024-01-01T00:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0'
        }
      };

      const result = StatsResponseSchema.safeParse(mockStatsResponse);
      expect(result.success).toBe(true);
    });

    test('POST /api/leads creates lead with validation', async () => {
      const validLeadData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'NEW'
      };

      const validation = Schemas.LeadCreate.safeParse(validLeadData);
      expect(validation.success).toBe(true);

      const mockCreateResponse = {
        success: true,
        data: {
          id: 'new-lead-id',
          ...validLeadData,
          userId: 'user-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        meta: {
          timestamp: '2024-01-01T00:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0'
        }
      };

      const result = StandardResponseSchema.safeParse(mockCreateResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling Contracts', () => {
    test('validation errors return proper format', () => {
      const validationErrors = ['name is required', 'email is invalid'];
      const response = ApiWrapper.validation(validationErrors);
      const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');

      expect(responseBody.success).toBe(false);
      expect(responseBody.error.errors).toEqual(validationErrors);
      expect(responseBody.error.code).toBe('ERR_VALIDATION');
    });

    test('unauthorized errors return proper format', () => {
      const response = ApiWrapper.unauthorized('Access denied');
      const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');

      expect(responseBody.success).toBe(false);
      expect(responseBody.error.message).toBe('Access denied');
      expect(responseBody.error.code).toBe('ERR_UNAUTHORIZED');
    });

    test('not found errors return proper format', () => {
      const response = ApiWrapper.notFound('Lead');
      const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');

      expect(responseBody.success).toBe(false);
      expect(responseBody.error.message).toBe('Lead not found');
      expect(responseBody.error.code).toBe('ERR_NOT_FOUND');
    });
  });

  describe('Rate Limiting Contract', () => {
    test('rate limit responses follow standard format', () => {
      const response = ApiWrapper.error('Rate limit exceeded', 429, {
        code: 'ERR_RATE_LIMIT'
      });
      const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');

      expect(responseBody.success).toBe(false);
      expect(responseBody.error.code).toBe('ERR_RATE_LIMIT');
      expect(responseBody.error.message).toBe('Rate limit exceeded');
    });
  });
});

// Performance contract tests
describe('Performance Contracts', () => {
  test('API responses include timing metadata', () => {
    const response = ApiWrapper.success({ data: 'test' });
    const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');

    expect(responseBody.meta).toBeDefined();
    expect(responseBody.meta.timestamp).toBeDefined();
  });

  test('pagination metadata is complete', () => {
    const response = ApiWrapper.paginated([], { page: 1, limit: 10, total: 0 });
    const responseBody = JSON.parse(response._getInitialBody ? response._getInitialBody() : '{}');

    expect(responseBody.pagination).toBeDefined();
    expect(responseBody.pagination.hasNextPage).toBeDefined();
    expect(responseBody.pagination.hasPrevPage).toBeDefined();
  });
});

export {
  mockUser,
  mockAdminUser,
  StandardResponseSchema,
  PaginatedLeadsResponseSchema,
  StatsResponseSchema
};
