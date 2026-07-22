// Enterprise Error System
// Standardized error handling across the entire application

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details })
      }
    };
  }
}

// Specific error types for common scenarios

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND',
      true
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT', true);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 503, 'DATABASE_ERROR', false);
  }
}

// Error response formatter for API responses
export function formatErrorResponse(error: Error | AppError) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error.details && { details: error.details })
      }
    };
  }

  // Unknown error - don't expose details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    success: false,
    error: {
      message: isDev ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      ...(isDev && { stack: error.stack })
    }
  };
}

// Global error handler wrapper
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Unique constraint')) {
      return new ConflictError('Resource already exists');
    }
    
    if (error.message.includes('Foreign key constraint')) {
      return new ValidationError('Referenced resource does not exist');
    }

    return new AppError(error.message);
  }

  return new AppError('An unexpected error occurred');
}
