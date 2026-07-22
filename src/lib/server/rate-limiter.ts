/**
 * Advanced rate limiting for Vercel Hobby Plan optimization
 * Prevents memory abuse through request throttling
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  resetTime: number;
  blockedUntil?: number;
  lastAccess: number;
}

class MemoryRateLimiter {
  private static instance: MemoryRateLimiter;
  private requests = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Rate limits per endpoint (requests per minute)
  private limits = {
    default: 120,       // Increased from 60
    heavy: 100,         // Increased from 30
    auth: 50,           // Increased from 20
    upload: 20,         // Increased from 10
  };
  
  private constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  static getInstance(): MemoryRateLimiter {
    if (!MemoryRateLimiter.instance) {
      MemoryRateLimiter.instance = new MemoryRateLimiter();
    }
    return MemoryRateLimiter.instance;
  }
  
  /**
   * Check if request is allowed
   */
  isAllowed(
    identifier: string, 
    endpoint: string = 'default',
    windowMs: number = 60 * 1000 // 1 minute
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);
    
    // Determine limit based on endpoint type
    let limit = this.limits.default;
    if (endpoint.includes('auth')) limit = this.limits.auth;
    else if (endpoint.includes('upload') || endpoint.includes('file')) limit = this.limits.upload;
    else if (endpoint.includes('time-tracking') || endpoint.includes('users') || endpoint.includes('deals')) limit = this.limits.heavy;
    
    // Create new entry if doesn't exist
    if (!entry) {
      const newEntry: RateLimitEntry = {
        count: 1,
        windowStart: now,
        lastAccess: now,
        resetTime: now + windowMs
      };
      this.requests.set(identifier, newEntry);
      
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: newEntry.resetTime
      };
    }
    
    // Check if window has expired
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
      entry.lastAccess = now;
      
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: entry.resetTime
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    // Increment count
    entry.count++;
    entry.lastAccess = now;
    
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime
    };
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.requests.entries()) {
      // Remove entries older than 10 minutes
      if (now - entry.lastAccess > 10 * 60 * 1000) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.requests.delete(key));
  }
  
  /**
   * Get current stats for monitoring
   */
  getStats(): {
    totalEntries: number;
    activeEntries: number;
    memoryUsage: string;
  } {
    const now = Date.now();
    let activeCount = 0;
    
    for (const entry of this.requests.values()) {
      if (now <= entry.resetTime) {
        activeCount++;
      }
    }
    
    const memoryUsage = JSON.stringify([...this.requests.entries()]).length;
    
    return {
      totalEntries: this.requests.size,
      activeEntries: activeCount,
      memoryUsage: `${Math.round(memoryUsage / 1024)}KB`
    };
  }
  
  /**
   * Reset specific identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.requests.clear();
  }
  
  /**
   * Destroy cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const rateLimiter = MemoryRateLimiter.getInstance();

/**
 * Middleware to apply rate limiting
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  options: {
    endpoint?: string;
    windowMs?: number;
    identifierGenerator?: (req: Request) => string;
  } = {}
) {
  return async (req: Request): Promise<Response> => {
    // Generate identifier (IP + User Agent)
    const identifier = options.identifierGenerator 
      ? options.identifierGenerator(req)
      : `${req.headers.get('x-forwarded-for') || 'unknown'}-${req.headers.get('user-agent') || 'unknown'}`;
    
    // Determine endpoint type
    const url = new URL(req.url);
    const endpoint = options.endpoint || url.pathname;
    
    // Check rate limit
    const result = rateLimiter.isAllowed(identifier, endpoint, options.windowMs);
    
    // Add rate limit headers
    const headers = new Headers({
      'X-RateLimit-Limit': result.allowed ? '60' : '0',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      'X-RateLimit-Reset-Unix': result.resetTime.toString()
    });
    
    // Block request if limit exceeded
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again after ${new Date(result.resetTime).toLocaleString()}`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    try {
      const response = await handler(req);
      
      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', '60');
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      return response;
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
}

/**
 * Get rate limiting stats for monitoring
 */
export function getRateLimitStats() {
  return rateLimiter.getStats();
}
