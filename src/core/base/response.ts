// Global API Response Standard
// All API responses follow this exact format

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  meta?: ResponseMeta;
  error?: ResponseError | null;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ResponseError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Success response builder
export function success<T>(
  data: T,
  meta?: Omit<ResponseMeta, 'timestamp'>
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    },
    error: null
  };
}

// Paginated success response
export function paginated<T>(
  data: T[],
  pagination: PaginationMeta,
  meta?: Omit<ResponseMeta, 'timestamp' | 'pagination'>
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      pagination,
      ...meta
    },
    error: null
  };
}

// Error response builder
export function error(
  message: string,
  code: string = 'INTERNAL_ERROR',
  details?: Record<string, unknown>
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    meta: {
      timestamp: new Date().toISOString()
    },
    error: {
      message,
      code,
      ...(details && { details })
    }
  };
}

// Common error responses
export const Errors = {
  unauthorized: () => error('Unauthorized', 'UNAUTHORIZED', { statusCode: 401 }),
  forbidden: () => error('Forbidden', 'FORBIDDEN', { statusCode: 403 }),
  notFound: (resource: string) => error(`${resource} not found`, 'NOT_FOUND', { statusCode: 404 }),
  validation: (details: Record<string, unknown>) => error('Validation failed', 'VALIDATION_ERROR', { statusCode: 400, details }),
  rateLimit: () => error('Too many requests', 'RATE_LIMIT', { statusCode: 429 }),
  internal: (message?: string) => error(message || 'Internal server error', 'INTERNAL_ERROR', { statusCode: 500 })
};

// Next.js Response helpers
export function jsonResponse<T>(response: ApiResponse<T>, statusCode: number = 200): Response {
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Wrap async handler with response formatting
export function asyncHandler<T>(
  fn: () => Promise<ApiResponse<T>>
): Promise<Response> {
  return fn()
    .then(response => jsonResponse(response))
    .catch(err => {
      console.error('API Error:', err);
      return jsonResponse(
        error(
          err.message || 'An unexpected error occurred',
          err.code || 'INTERNAL_ERROR',
          process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
        ),
        err.statusCode || 500
      );
    });
}
