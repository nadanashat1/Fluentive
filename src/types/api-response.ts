// Shared API Response Type - Enforced at route and frontend level
// Single source of truth for all API responses

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Auth-specific response types
export type AuthResponse = ApiResponse<{
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
  };
  token?: string;
  refreshToken?: string;
}>;

// Generic success response creator
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}

// Generic error response creator
export function createErrorResponse(error: string): ApiResponse<never> {
  return {
    success: false,
    error
  };
}

// Type guard for API responses
export function isApiResponse<T>(data: any): data is ApiResponse<T> {
  if (typeof data !== 'object' || data === null) return false;
  if (typeof data.success !== 'boolean') return false;
  if (data.success === true) {
    return 'data' in data;
  }
  return typeof data.error === 'string';
}
