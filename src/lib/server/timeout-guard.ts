/**
 * Request timeout guard for Vercel Hobby Plan optimization
 * Prevents hanging requests that could exceed memory/time limits
 */

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000 // Vercel functions have 30s limit, use 25s for safety
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Wrapper for API handlers with timeout protection
 */
export function withApiTimeout<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  timeoutMs: number = 25000
) {
  return async (...args: T): Promise<R> => {
    return withTimeout(handler(...args), timeoutMs);
  };
}

/**
 * Memory usage guard - checks if memory usage is critical
 */
export function checkMemoryUsage(): { isCritical: boolean; usage: string } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const usedMemory = usage.heapUsed / 1024 / 1024; // MB
    const totalMemory = usage.heapTotal / 1024 / 1024; // MB
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    return {
      isCritical: memoryUsagePercent > 85, // Critical if > 85% of heap used
      usage: `${Math.round(usedMemory)}MB / ${Math.round(totalMemory)}MB (${Math.round(memoryUsagePercent)}%)`
    };
  }
  
  return { isCritical: false, usage: 'N/A' };
}

/**
 * Safe response with memory check
 */
export function safeResponse(
  response: any,
  statusCode: number = 200
): Response {
  const memoryCheck = checkMemoryUsage();
  
  if (memoryCheck.isCritical) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable - high memory usage',
        memoryUsage: memoryCheck.usage
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
