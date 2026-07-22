// Safe API Fetch with HTML Leak Prevention
// Prevents HTML error pages from breaking JSON parsing

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function safeApiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  // Critical: Check content type before parsing JSON
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    // This prevents HTML error pages from breaking the app
    const text = await response.text();
    
    // Log the error for debugging
    console.error('API returned non-JSON response:', {
      url,
      status: response.status,
      contentType,
      preview: text.substring(0, 200)
    });
    
    throw new Error(
      `API returned ${contentType || 'unknown'} instead of JSON. ` +
      `This usually means a TypeScript compilation error in the route. ` +
      `Status: ${response.status}`
    );
  }
  
  return response;
}

export async function safeApiCall<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await safeApiFetch(url, options);
  return response.json();
}

// Enhanced fetch for auth endpoints with additional safety
export async function safeAuthCall<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  // Add auth-specific headers if needed
  const enhancedOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  };
  
  return safeApiCall<T>(url, enhancedOptions);
}
