// Infrastructure Module - Cache service ONLY
import { RedisCache } from '@/lib/cache/redis-client';

export class CacheService {
  // Simple cache operations - NO business logic
  static async get<T>(key: string): Promise<T | null> {
    try {
      return await RedisCache.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
    try {
      await RedisCache.set(key, data, ttlSeconds);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    try {
      // Simple pattern matching - would use Redis SCAN in real implementation
      await RedisCache.del(pattern);
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await RedisCache.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await RedisCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}
