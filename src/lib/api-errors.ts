// API Errors - Centralized error system
// Production critical: predictable error handling, no random catch (e: any)

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message: string = 'API Error'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network Error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: string[],
    message: string = 'Validation Error'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error handling utilities
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};
