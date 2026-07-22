// Simple in-memory rate limiter for production
// For high traffic, use Redis instead

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    store.delete(identifier);
  }

  if (!store.has(identifier)) {
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  const current = store.get(identifier)!;
  
  if (current.count >= maxRequests) {
    return { success: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  return { success: true, remaining: maxRequests - current.count, resetTime: current.resetTime };
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getRateLimitKey(request: Request): string {
  // Get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip;
}
