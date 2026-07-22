// Query safety wrapper for production SaaS architecture
export async function safeQuery<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('DB_ERROR:', error);
    throw new Error('Database operation failed');
  }
}

// Connection reuse optimization
export function withConnectionReuse<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}

// Cache helper for future Redis integration
export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = { ttl: 300 }
): Promise<T> {
  // Future Redis implementation
  return fn();
}
