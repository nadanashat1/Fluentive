// Standardized Response Structure for Vercel Hobby
// Ensures all endpoints return consistent, production-safe responses

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ErrorResponse extends ApiResponse<null> {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(error: string, code?: string): ErrorResponse {
  return {
    success: false,
    error,
    code,
    timestamp: new Date().toISOString()
  };
}

export function createPaginatedResponse<T>(
  data: T[], 
  page: number, 
  limit: number, 
  total: number,
  message?: string
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total
    },
    message,
    timestamp: new Date().toISOString()
  };
}
