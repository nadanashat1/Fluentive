import { NextResponse } from 'next/server';
import { createErrorResponse, type ApiResponse } from '@/lib/api/contracts';

// Global error handler wrapper for API routes
export function withErrorHandler<T = any>(
  handler: (request: Request, context?: any) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: Request, context?: any): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't leak internal errors in production
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error instanceof Error ? error.message : 'Unknown error';
      
      return NextResponse.json(
        createErrorResponse(message),
        { status: 500 }
      );
    }
  };
}

// Helper for success responses
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

// Helper for error responses
export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    createErrorResponse(message),
    { status }
  );
}
