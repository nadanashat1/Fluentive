// Enterprise-grade rate limiting for API protection
// Prevents abuse and DDoS attacks

interface RateLimitEntry {
  requests: number[];
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // Standard API endpoints: 100 requests per minute
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Auth endpoints: 10 requests per minute (prevent brute force)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // Heavy operations: 5 requests per minute
  heavy: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
};

export type RateLimitTier = 'standard' | 'auth' | 'heavy';

export function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'standard'
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMIT_CONFIG[tier];
  const now = Date.now();
  
  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupOldEntries();
  }
  
  let entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    entry = { requests: [] };
    rateLimitStore.set(identifier, entry);
  }
  
  // Check if currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil,
    };
  }
  
  // Clear block if expired
  if (entry.blockedUntil && now >= entry.blockedUntil) {
    entry.blockedUntil = undefined;
    entry.requests = [];
  }
  
  // Remove old requests outside the window
  entry.requests = entry.requests.filter(
    (time) => now - time < config.windowMs
  );
  
  // Check if limit exceeded
  if (entry.requests.length >= config.maxRequests) {
    // Block for 5 minutes after exceeding limit
    entry.blockedUntil = now + 5 * 60 * 1000;
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil,
    };
  }
  
  // Add current request
  entry.requests.push(now);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.requests.length,
    resetTime: now + config.windowMs,
  };
}

function cleanupOldEntries(): void {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.blockedUntil && now > entry.blockedUntil + maxAge) {
      rateLimitStore.delete(key);
    } else if (entry.requests.length === 0 && !entry.blockedUntil) {
      rateLimitStore.delete(key);
    }
  }
}

// Get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default (in production, this should never happen)
  return 'unknown';
}
