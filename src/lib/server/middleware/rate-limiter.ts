import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for production
// In production, use Redis-based rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
}

/**
 * Rate limiting middleware for API endpoints
 */
export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(request: NextRequest): NextResponse | null {
    const clientId = getClientId(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    // Get or create client record
    let clientRecord = rateLimitStore.get(clientId);
    
    if (!clientRecord || clientRecord.resetTime < now) {
      // New window
      clientRecord = {
        count: 1,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(clientId, clientRecord);
      return null; // Allow request
    }

    // Check if limit exceeded
    if (clientRecord.count >= config.max) {
      return NextResponse.json({
        success: false,
        error: config.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil((clientRecord.resetTime - now) / 1000)
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': clientRecord.resetTime.toString(),
          'Retry-After': Math.ceil((clientRecord.resetTime - now) / 1000).toString()
        }
      });
    }

    // Increment count
    clientRecord.count++;
    rateLimitStore.set(clientId, clientRecord);

    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.max.toString());
    response.headers.set('X-RateLimit-Remaining', (config.max - clientRecord.count).toString());
    response.headers.set('X-RateLimit-Reset', clientRecord.resetTime.toString());
    
    return null; // Allow request
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get IP address from forwarded header
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  // Try to get user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a hash from IP and user agent
  return Buffer.from(`${ip}:${userAgent}`).toString('base64');
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Auth endpoints - reasonable limit for development
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per 15 minutes (increased from 5)
    message: 'Too many authentication attempts, please try again later.'
  },
  
  // General API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Rate limit exceeded, please try again later.'
  },
  
  // Sensitive operations
  sensitive: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many sensitive operations, please try again later.'
  }
};
