// Standard API response contract for all endpoints
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Success response helper
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

// Error response helper
export function createErrorResponse(error: string, statusCode?: number): ApiResponse {
  return {
    success: false,
    error
  };
}

// Type guard for success responses
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

// Type guard for error responses
export function isErrorResponse(response: ApiResponse): response is ApiResponse & { success: false; error: string } {
  return response.success === false && response.error !== undefined;
}
