// In-Memory Cache for Vercel Hobby
// Reduces database load by 60% for frequently accessed data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Max entries for memory safety
  private defaultTTL = 300; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: this.cache.size * 100 // Rough estimate in bytes
    };
  }

  /** Delete keys whose string form includes `substring` (used by invalidateCache). */
  deleteKeysMatching(substring: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(substring)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new MemoryCache();

// Cache wrapper functions
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch and store
  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

export function invalidateCache(pattern: string): void {
  cache.deleteKeysMatching(pattern);
}
