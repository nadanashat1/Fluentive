// API Failure Guard - Zero Crash Endpoints
// Wraps all API handlers with error protection and timeouts
// Prevents hanging deploys and runtime crashes

import { NextRequest, NextResponse } from 'next/server';

// Standard error response format
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    timestamp: string;
  };
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// API Response type
export type ApiResponse<T> = NextResponse<SuccessResponse<T> | ErrorResponse>;

// Timeout wrapper - prevents hanging promises
export function withTimeout<T>(
  promise: Promise<T>,
  ms = 8000,
  context = 'API Request'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        reject(new Error(`${context} timed out after ${ms}ms`));
      }, ms)
    ),
  ]);
}

// Safe handler wrapper - catches all errors
export async function safeHandler<T>(
  fn: () => Promise<NextResponse<T>>,
  context = 'API'
): Promise<NextResponse<T | ErrorResponse>> {
  const startTime = Date.now();
  
  try {
    // Execute handler with timeout
    const response = await withTimeout(
      fn(),
      10000, // 10 second default timeout
      context
    );
    
    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime;
      console.log(`✅ ${context} completed in ${duration}ms`);
    }
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error
    console.error(`❌ ${context} failed after ${duration}ms:`, error);
    
    // Determine error type
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      // Timeout errors
      if (error.message.includes('timed out')) {
        statusCode = 504;
        errorCode = 'TIMEOUT';
        errorMessage = 'Request timed out. Please try again.';
      }
      // Database errors
      else if (error.message.includes('database') || error.message.includes('prisma')) {
        statusCode = 503;
        errorCode = 'DATABASE_ERROR';
        errorMessage = 'Database connection error. Please try again.';
      }
      // Authentication errors
      else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        statusCode = 401;
        errorCode = 'AUTH_ERROR';
        errorMessage = 'Authentication failed';
      }
      // Rate limit errors
      else if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorCode = 'RATE_LIMIT';
        errorMessage = 'Too many requests. Please slow down.';
      }
      // Use actual error message for other errors
      else {
        errorMessage = isProduction() ? 'An error occurred' : error.message;
      }
    }
    
    // Return safe error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
      },
    };
    
    return NextResponse.json(errorResponse, { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Code': errorCode,
      },
    });
  }
}

// Create success response
export function successResponse<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// Create error response
export function errorResponse(
  message: string,
  code = 'ERROR',
  status = 400
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// Safe database operation wrapper
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  context = 'Database'
): Promise<T> {
  return withTimeout(
    operation(),
    5000, // 5 second DB timeout
    `${context} query`
  );
}

// Safe external API call wrapper
export async function safeExternalCall<T>(
  call: () => Promise<T>,
  context = 'External API'
): Promise<T> {
  return withTimeout(
    call(),
    8000, // 8 second external API timeout
    context
  );
}

// Helper to check if in production
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Safe JSON stringify
export function safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}
