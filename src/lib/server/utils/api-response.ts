// Enterprise-grade API response utilities
// Standardizes responses and adds security headers

import { NextResponse } from 'next/server';

// Security headers for all API responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, max-age=0',
};

// Success response
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message: message || null,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: SECURITY_HEADERS,
    }
  );
}

// Error response
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: code || `ERR_${status}`,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status,
      headers: SECURITY_HEADERS,
    }
  );
}

// Validation error response
export function validationErrorResponse(errors: string[]): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Validation failed',
        errors,
        code: 'ERR_VALIDATION',
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 400,
      headers: SECURITY_HEADERS,
    }
  );
}

// Rate limit error response
export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        code: 'ERR_RATE_LIMIT',
        retryAfter,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 429,
      headers: {
        ...SECURITY_HEADERS,
        'Retry-After': String(retryAfter),
      },
    }
  );
}

// Unauthorized response
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(message, 401, 'ERR_UNAUTHORIZED');
}

// Forbidden response
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse(message, 403, 'ERR_FORBIDDEN');
}

// Not found response
export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return errorResponse(`${resource} not found`, 404, 'ERR_NOT_FOUND');
}

// Paginated response
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        ...pagination,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: SECURITY_HEADERS,
    }
  );
}
