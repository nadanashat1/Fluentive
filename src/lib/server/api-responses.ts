import { NextResponse } from 'next/server';
import { getContext } from './request-context';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta: {
    requestId: string;
    timestamp: string;
    durationMs: number;
    cacheStatus?: 'HIT' | 'MISS' | 'BYPASS' | 'STALE';
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
    durationMs: number;
  };
}

/**
 * Creates a normalized successful API response.
 */
export function createApiResponse<T>(
  data: T,
  message?: string,
  options?: { status?: number; headers?: HeadersInit }
): NextResponse<ApiSuccessResponse<T>> {
  const context = getContext();
  const requestId = context?.requestId || 'unknown';
  const durationMs = context ? Date.now() - context.startTime : 0;
  
  if (context) {
    context.duration = durationMs;
  }

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      durationMs,
      cacheStatus: context?.cacheStatus,
    }
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, {
    status: options?.status || 200,
    headers: options?.headers,
  });
}

/**
 * Creates a normalized error API response.
 */
export function createApiError(
  message: string,
  code: string = 'INTERNAL_ERROR',
  status: number = 500,
  details?: unknown,
  headers?: HeadersInit
): NextResponse<ApiErrorResponse> {
  const context = getContext();
  const requestId = context?.requestId || 'unknown';
  const durationMs = context ? Date.now() - context.startTime : 0;
  
  if (context) {
    context.duration = durationMs;
  }

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {})
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      durationMs,
    }
  };

  return NextResponse.json(response, { status, headers });
}
