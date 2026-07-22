/**
 * Response compression utilities for Vercel Hobby Plan optimization
 * Reduces payload size and memory usage
 */

/**
 * Compress JSON response by removing unnecessary whitespace and optimizing data
 */
export function optimizeJsonResponse(data: any): any {
  if (data === null || data === undefined) return data;
  
  // Remove undefined values and null strings
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== null && item !== undefined)
      .map(item => optimizeJsonResponse(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const optimized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        optimized[key] = optimizeJsonResponse(value);
      }
    }
    return optimized;
  }
  
  return data;
}

/**
 * Create a compressed response with proper headers
 */
export function createCompressedResponse(
  data: any,
  statusCode: number = 200,
  headers: Record<string, string> = {}
): Response {
  // Optimize the data first
  const optimizedData = optimizeJsonResponse(data);
  
  // Convert to string and measure size
  const jsonString = JSON.stringify(optimizedData);
  const sizeInBytes = new Blob([jsonString]).size;
  const sizeInKB = Math.round(sizeInBytes / 1024);
  
  // Create response headers
  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    'Content-Length': sizeInBytes.toString(),
    'X-Content-Size-KB': sizeInKB.toString(),
    ...headers
  });
  
  // Add compression hint for large responses
  if (sizeInKB > 50) {
    responseHeaders.set('X-Compression-Recommended', 'true');
  }
  
  return new Response(jsonString, {
    status: statusCode,
    headers: responseHeaders
  });
}

/**
 * Middleware to compress API responses
 */
export function withCompression(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      const response = await handler(req);
      
      // Only compress JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        
        return createCompressedResponse(
          data,
          response.status,
          Object.fromEntries(response.headers.entries())
        );
      }
      
      return response;
    } catch (error) {
      return createCompressedResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        },
        500
      );
    }
  };
}

/**
 * Check if response size is getting too large for Vercel Hobby plan
 */
export function validateResponseSize(data: any, maxSizeKB: number = 1024): {
  isValid: boolean;
  sizeKB: number;
  warning?: string;
} {
  const jsonString = JSON.stringify(data);
  const sizeInKB = Math.round(new Blob([jsonString]).size / 1024);
  
  return {
    isValid: sizeInKB <= maxSizeKB,
    sizeKB: sizeInKB,
    warning: sizeInKB > maxSizeKB 
      ? `Response size (${sizeInKB}KB) exceeds recommended limit (${maxSizeKB}KB)` 
      : undefined
  };
}
