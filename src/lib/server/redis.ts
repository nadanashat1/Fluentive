import { logger } from '@/lib/observability/logger';

// Enterprise Redis caching layer with strict 500ms timeout and memory fallback.
let redis: any = null;

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiry: number }>();

// Try to initialize ioredis
try {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL; // fallback url name
  if (redisUrl && (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://'))) {
    const Redis = require('ioredis');
    redis = new Redis(redisUrl, {
      connectTimeout: 500, // Fail fast on initial connection
      commandTimeout: 500, // Strict 500ms command timeout
      retryStrategy: (times: number) => {
        // Aggressive retry logic: retry up to 3 times, wait 100ms between attempts
        if (times > 3) return null;
        return 100;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    redis.on('error', (err: Error) => {
      logger.warn('cache', `Redis connection error: ${err.message}`);
    });

    redis.on('connect', () => {
      logger.info('cache', 'Redis client connected successfully');
    });
  } else {
    logger.info('cache', 'Redis URL not configured or invalid, defaulting to memory cache');
  }
} catch (err) {
  logger.warn('cache', `Failed to initialize Redis client: ${String(err)}`);
}

// 500ms timeout wrapper helper
async function withTimeout<T = any>(promise: Promise<T>, ms = 500): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Redis operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SESSION: 60 * 60, // 1 hour
  USER: 5 * 60, // 5 minutes
  LEADS: 2 * 60, // 2 minutes
  DEALS: 2 * 60, // 2 minutes
  NOTIFICATIONS: 30, // 30 seconds
  ANALYTICS: 10 * 60, // 10 minutes
  STATIC: 60 * 60, // 1 hour
};

// Get cached value
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const value = await withTimeout<string | null>(redis.get(key), 500);
      if (value) {
        return JSON.parse(value);
      }
    }
  } catch (error) {
    logger.warn('cache', `Redis get failed, falling back to memory: ${String(error)}`, { key });
  }

  // Fallback to memory cache
  try {
    const memoryValue = memoryCache.get(key);
    if (memoryValue && memoryValue.expiry > Date.now()) {
      return JSON.parse(memoryValue.value);
    }
  } catch (error) {
    logger.error('cache', `Memory cache get failed: ${String(error)}`, undefined, { key });
  }
  return null;
}

// Set cached value
export async function cacheSet(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.USER
): Promise<void> {
  const serialized = JSON.stringify(value);

  try {
    if (redis) {
      await withTimeout(redis.setex(key, ttl, serialized), 500);
      return;
    }
  } catch (error) {
    logger.warn('cache', `Redis setex failed, falling back to memory: ${String(error)}`, { key, ttl });
  }

  // Fallback to memory cache
  try {
    memoryCache.set(key, {
      value: serialized,
      expiry: Date.now() + ttl * 1000,
    });

    // Cleanup expired memory cache entries periodically
    if (memoryCache.size > 1000) {
      cleanupMemoryCache();
    }
  } catch (error) {
    logger.error('cache', `Memory cache set failed: ${String(error)}`, undefined, { key });
  }
}

// Delete cached value
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (redis) {
      await withTimeout(redis.del(key), 500);
    }
  } catch (error) {
    logger.warn('cache', `Redis delete failed, falling back to memory: ${String(error)}`, { key });
  }
  memoryCache.delete(key);
}

// Delete multiple keys by pattern
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    if (redis) {
      const keys = await withTimeout<string[]>(redis.keys(pattern), 500);
      if (keys && keys.length > 0) {
        await withTimeout(redis.del(...keys), 500);
      }
    }
  } catch (error) {
    logger.warn('cache', `Redis delete pattern failed, falling back to memory: ${String(error)}`, { pattern });
  }

  // Memory cache pattern delete
  try {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    logger.error('cache', `Memory cache pattern delete failed: ${String(error)}`, undefined, { pattern });
  }
}

// Get cache statistics
export async function cacheStats(): Promise<{
  redis: boolean;
  memorySize: number;
}> {
  return {
    redis: redis !== null,
    memorySize: memoryCache.size,
  };
}

// Cleanup expired memory cache entries
function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiry < now) {
      memoryCache.delete(key);
    }
  }
}

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  leads: (userId: string, filters?: string) =>
    `leads:${userId}${filters ? `:${filters}` : ''}`,
  lead: (id: string) => `lead:${id}`,
  deals: (userId: string) => `deals:${userId}`,
  deal: (id: string) => `deal:${id}`,
  notifications: (userId: string) => `notifications:${userId}`,
  notificationsUnread: (userId: string) => `notifications:unread:${userId}`,
  analytics: (type: string, userId?: string) =>
    `analytics:${type}${userId ? `:${userId}` : ''}`,
  session: (token: string) => `session:${token}`,
};

// Cache wrapper for async functions
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CACHE_TTL.USER
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function
  const result = await fn();

  // Store in cache
  await cacheSet(key, result, ttl);

  return result;
}

// Invalidate cache by tags
export async function invalidateCache(tags: string[]): Promise<void> {
  for (const tag of tags) {
    await cacheDeletePattern(`*${tag}*`);
  }
}
