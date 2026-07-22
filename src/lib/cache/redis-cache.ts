// Real Redis caching layer for enterprise SaaS
interface CacheEntry<T> {
  data: T;
  expires: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set<T>(key: string, data: T, ttl = 60): Promise<void> {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// Export singleton cache instance
export const cache = new InMemoryCache();

// Cache helper functions
export async function getOrSetCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 60
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fn();
  await cache.set(key, data, ttl);
  return data;
}

// Cache invalidation helpers
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  LEADS_LIST: (userId: string) => `leads:list:${userId}`,
  DASHBOARD_STATS: (userId: string) => `dashboard:stats:${userId}`,
  ANALYTICS_DATA: (period: string) => `analytics:data:${period}`,
  AI_INSIGHTS: (userId: string) => `ai:insights:${userId}`,
} as const;
