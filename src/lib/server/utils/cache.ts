// Enterprise-grade API response caching
// Improves performance and reduces database load

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 60 * 1000; // 1 minute default
  
  // Get cached data
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  // Set cached data
  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs ?? this.defaultTTL,
    });
  }
  
  // Delete cached entry
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  // Delete entries by pattern (for cache invalidation)
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear();
  }
  
  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cache key generator for API routes
export function generateCacheKey(
  route: string,
  userId?: string,
  params?: Record<string, unknown>
): string {
  const base = `api:${route}`;
  const user = userId ? `:user:${userId}` : '';
  const paramStr = params ? `:params:${JSON.stringify(params)}` : '';
  return `${base}${user}${paramStr}`;
}

// Cache TTL presets
export const CACHE_TTL = {
  // User data changes frequently
  user: 30 * 1000, // 30 seconds
  
  // Leads may change
  leads: 60 * 1000, // 1 minute
  
  // Deals change often
  deals: 60 * 1000, // 1 minute
  
  // Notifications change very frequently
  notifications: 15 * 1000, // 15 seconds
  
  // Analytics/data rarely changes
  analytics: 5 * 60 * 1000, // 5 minutes
  
  // Static/reference data
  static: 60 * 60 * 1000, // 1 hour
};
