// Global Query Limit Guard for Vercel Hobby
// Prevents memory explosion by enforcing maximum query limits

interface QueryLimitConfig {
  maxItems: number;
  maxDays: number;
}

export const LIMITS: Record<string, QueryLimitConfig> = {
  default: { maxItems: 50, maxDays: 30 },
  analytics: { maxItems: 20, maxDays: 7 },
  notifications: { maxItems: 20, maxDays: 30 },
  activities: { maxItems: 20, maxDays: 7 },
  admin: { maxItems: 10, maxDays: 30 }
};

export function enforceLimit(
  limit: number | string | undefined,
  config: QueryLimitConfig = LIMITS.default,
  maxOverride?: number
): number {
  const maxLimit = maxOverride || config.maxItems;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit) : limit || 0;
  
  if (parsedLimit > maxLimit) {
    throw new Error(`Query limit exceeded: maximum ${maxLimit} items allowed`);
  }
  
  return Math.min(parsedLimit, maxLimit);
}

export function enforceDaysLimit(
  days: number | string | undefined,
  config: QueryLimitConfig = LIMITS.default,
  maxOverride?: number
): number {
  const maxDays = maxOverride || config.maxDays;
  const parsedDays = typeof days === 'string' ? parseInt(days) : days || 0;
  
  if (parsedDays > maxDays) {
    throw new Error(`Time range exceeded: maximum ${maxDays} days allowed`);
  }
  
  return Math.min(parsedDays, maxDays);
}
