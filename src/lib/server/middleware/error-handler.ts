/**
 * Centralized Error Handler for Production
 * Provides consistent error responses and logging
 */

import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  // Known error types
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  // Database errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'Resource already exists' },
        { status: 409 }
      );
    }
    
    if (message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 401 }
      );
    }
  }

  // Unknown errors
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}

export function createSuccessResponse<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data });
}

export function createErrorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}
