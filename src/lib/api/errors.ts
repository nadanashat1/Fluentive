// ==========================================
// GLOBAL ERROR SYSTEM
// Standardizes API errors across the enterprise platform.
// ==========================================

export type ErrorCode = 
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN' 
  | 'NOT_FOUND' 
  | 'VALIDATION_ERROR' 
  | 'INTERNAL_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED';

export interface AppErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
}

export class AppError extends Error {
  public code: ErrorCode;
  public status: number;
  public details?: any;

  constructor(code: ErrorCode, message: string, status: number = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  static Unauthorized(message = 'Unauthorized action.') {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static Forbidden(message = 'You do not have permission to perform this action.') {
    return new AppError('FORBIDDEN', message, 403);
  }

  static NotFound(message = 'Resource not found.') {
    return new AppError('NOT_FOUND', message, 404);
  }

  static Validation(message = 'Invalid data provided.', details?: any) {
    return new AppError('VALIDATION_ERROR', message, 400, details);
  }

  static Conflict(message = 'Resource conflict.') {
    return new AppError('CONFLICT', message, 409);
  }

  static Internal(message = 'Internal server error.', details?: any) {
    return new AppError('INTERNAL_ERROR', message, 500, details);
  }

  public toJSON(): AppErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      }
    };
  }
}

// Normalizes unknown errors (e.g. Prisma throws) into standard format
export const normalizeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  // Basic Prisma Error Catching (could be expanded)
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaErr = error as any;
    if (prismaErr.code === 'P2002') {
      return AppError.Conflict('A record with this value already exists.');
    }
    if (prismaErr.code === 'P2025') {
      return AppError.NotFound('Record not found.');
    }
  }

  const message = error instanceof Error ? error.message : 'An unknown error occurred.';
  return AppError.Internal(message);
};
