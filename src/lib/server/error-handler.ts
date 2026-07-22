import { NextResponse } from 'next/server';

/**
 * Production-grade error handling
 * Never exposes internal errors to clients
 */

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  public errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT');
  }
}

/**
 * Handle API errors and return appropriate responses
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the error for debugging (in production, use proper logging)
  console.error('API Error:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && { errors: error.errors })
      }
    }, { 
      status: error.statusCode,
      headers: {
        'X-Error-Type': error.code
      }
    });
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const validationErrors = (error as any).issues.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));

    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: validationErrors
      }
    }, { 
      status: 400,
      headers: {
        'X-Error-Type': 'VALIDATION_ERROR'
      }
    });
  }

  // Handle JWT errors
  if (error instanceof Error && error.name === 'JsonWebTokenError') {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    }, { 
      status: 401,
      headers: {
        'X-Error-Type': 'INVALID_TOKEN'
      }
    });
  }

  if (error instanceof Error && error.name === 'TokenExpiredError') {
    return NextResponse.json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired'
      }
    }, { 
      status: 401,
      headers: {
        'X-Error-Type': 'TOKEN_EXPIRED'
      }
    });
  }

  // Handle Prisma errors
  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Resource already exists'
          }
        }, { 
          status: 409,
          headers: {
            'X-Error-Type': 'DUPLICATE_ENTRY'
          }
        });
      
      case 'P2025':
        return NextResponse.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found'
          }
        }, { 
          status: 404,
          headers: {
            'X-Error-Type': 'NOT_FOUND'
          }
        });
      
      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed'
          }
        }, { 
          status: 500,
          headers: {
            'X-Error-Type': 'DATABASE_ERROR'
          }
        });
    }
  }

  // Default error response (never expose internal errors)
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }, { 
    status: 500,
    headers: {
      'X-Error-Type': 'INTERNAL_ERROR'
    }
  });
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler(handler: (request: Request, ...args: any[]) => Promise<NextResponse>) {
  return async (request: Request, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
