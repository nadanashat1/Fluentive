// Tenant-aware rate limiting for production SaaS architecture
import { RedisCache } from '@/lib/cache/redis-client';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface TenantRateLimitConfig {
  free: RateLimitConfig;
  pro: RateLimitConfig;
  enterprise: RateLimitConfig;
}

export class TenantRateLimiter {
  private static configs: TenantRateLimitConfig = {
    free: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    pro: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    enterprise: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  };

  // Rate limiting per tenant and endpoint
  static async checkRateLimit(
    tenantId: string,
    endpoint: string,
    plan: 'free' | 'pro' | 'enterprise' = 'free',
    identifier?: string // Additional identifier (user ID, IP, etc.)
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = this.configs[plan];
    const key = `rate_limit:${tenantId}:${endpoint}${identifier ? `:${identifier}` : ''}`;
    
    try {
      const current = await RedisCache.get<number>(key) || 0;
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Get current request count
      const requests = await RedisCache.get<{ count: number; windowStart: number }>(key) || {
        count: 0,
        windowStart: now
      };

      // Reset window if expired
      if (requests.windowStart < windowStart) {
        requests.count = 0;
        requests.windowStart = now;
      }

      // Check if limit exceeded
      const allowed = requests.count < config.maxRequests;
      
      if (allowed) {
        requests.count++;
        await RedisCache.set(key, requests, Math.ceil(config.windowMs / 1000));
      }

      return {
        allowed,
        remaining: Math.max(0, config.maxRequests - requests.count),
        resetTime: requests.windowStart + config.windowMs,
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Allow request if rate limiting fails
      return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
    }
  }

  // Rate limiting per user within tenant
  static async checkUserRateLimit(
    tenantId: string,
    userId: string,
    endpoint: string,
    plan: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    return this.checkRateLimit(tenantId, endpoint, plan, `user:${userId}`);
  }

  // Rate limiting per IP within tenant
  static async checkIpRateLimit(
    tenantId: string,
    ip: string,
    endpoint: string,
    plan: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    return this.checkRateLimit(tenantId, endpoint, plan, `ip:${ip}`);
  }

  // Advanced rate limiting with different limits per endpoint
  static async checkEndpointRateLimit(
    tenantId: string,
    endpoint: string,
    plan: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // Different limits for different endpoints
    const endpointLimits: Record<string, Partial<RateLimitConfig>> = {
      '/api/auth/login': { maxRequests: 5 }, // Stricter for auth
      '/api/auth/register': { maxRequests: 3 },
      '/api/leads': { maxRequests: 50 }, // Higher for CRUD operations
      '/api/analytics': { maxRequests: 30 }, // Lower for analytics
      '/api/ai/dashboard': { maxRequests: 20 }, // Lower for AI features
    };

    const baseConfig = this.configs[plan];
    const endpointConfig = endpointLimits[endpoint] || {};
    const finalConfig = { ...baseConfig, ...endpointConfig };

    const key = `rate_limit:${tenantId}:${endpoint}`;
    
    try {
      const requests = await RedisCache.get<{ count: number; windowStart: number }>(key) || {
        count: 0,
        windowStart: Date.now()
      };

      const now = Date.now();
      const windowStart = now - finalConfig.windowMs!;

      // Reset window if expired
      if (requests.windowStart < windowStart) {
        requests.count = 0;
        requests.windowStart = now;
      }

      // Check if limit exceeded
      const allowed = requests.count < finalConfig.maxRequests!;
      
      if (allowed) {
        requests.count++;
        await RedisCache.set(key, requests, Math.ceil(finalConfig.windowMs! / 1000));
      }

      return {
        allowed,
        remaining: Math.max(0, finalConfig.maxRequests! - requests.count),
        resetTime: requests.windowStart + finalConfig.windowMs!,
      };
    } catch (error) {
      console.error('Endpoint rate limit check failed:', error);
      return { allowed: true, remaining: finalConfig.maxRequests!, resetTime: Date.now() + finalConfig.windowMs! };
    }
  }

  // Clear rate limits for a tenant (admin function)
  static async clearTenantRateLimits(tenantId: string): Promise<void> {
    try {
      // This would require Redis scan operation
      // For now, we'll use a simple approach
      const commonEndpoints = ['/api/auth/login', '/api/auth/register', '/api/leads', '/api/analytics', '/api/ai/dashboard'];
      
      for (const endpoint of commonEndpoints) {
        await RedisCache.del(`rate_limit:${tenantId}:${endpoint}`);
      }
    } catch (error) {
      console.error('Failed to clear tenant rate limits:', error);
    }
  }

  // Get rate limit statistics for a tenant
  static async getTenantRateLimitStats(tenantId: string): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    const commonEndpoints = ['/api/auth/login', '/api/auth/register', '/api/leads', '/api/analytics', '/api/ai/dashboard'];
    
    for (const endpoint of commonEndpoints) {
      try {
        const data = await RedisCache.get(`rate_limit:${tenantId}:${endpoint}`);
        stats[endpoint] = data || { count: 0, windowStart: Date.now() };
      } catch (error) {
        stats[endpoint] = { count: 0, windowStart: Date.now() };
      }
    }
    
    return stats;
  }
}
