// SaaS Execution Kernel - The most important file in the project
// This is the central control plane that enforces ALL SaaS layers
import { TenantService } from '@/lib/tenant/tenant-context';
import { TenantRateLimiter } from '@/lib/rate-limiting/tenant-rate-limiter';
import { RedisCache } from '@/lib/cache/redis-client';
import { backgroundProcessor } from '@/lib/background/background-processor';
import { logger } from '@/lib/observability/logger';

export interface SaaSExecutionConfig<T> {
  tenantId: string;
  userId: string;
  key: string; // Operation key for caching/metrics
  operation: string; // Operation type for rate limiting
  rateLimit?: boolean;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  backgroundJob?: boolean;
  priority?: number;
  query: () => Promise<T>;
  onSuccess?: (result: T) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

export interface SaaSExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    tenantId: string;
    userId: string;
    operation: string;
    duration: number;
    cached: boolean;
    rateLimited: boolean;
    backgroundJob: boolean;
  };
}

export class SaaSExecutor {
  private static instance: SaaSExecutor;
  private executionStats = new Map<string, { count: number; avgDuration: number; errors: number }>();

  static getInstance(): SaaSExecutor {
    if (!SaaSExecutor.instance) {
      SaaSExecutor.instance = new SaaSExecutor();
    }
    return SaaSExecutor.instance;
  }

  // Main execution method - ALL SaaS operations MUST pass through here
  async execute<T>(config: SaaSExecutionConfig<T>): Promise<SaaSExecutionResult<T>> {
    const startTime = Date.now();
    const traceId = crypto.randomUUID();
    
    const metadata = {
      tenantId: config.tenantId,
      userId: config.userId,
      operation: config.operation,
      duration: 0,
      cached: false,
      rateLimited: false,
      backgroundJob: !!config.backgroundJob,
    };

    try {
      logger.info('saas-executor', `Starting execution: ${config.operation}`, {
        traceId,
        tenantId: config.tenantId,
        userId: config.userId,
        key: config.key,
      });

      // STEP 1: Tenant Enforcement (MANDATORY)
      await this.enforceTenantAccess(config.tenantId, config.userId);

      // STEP 2: Rate Limiting (MANDATORY if enabled)
      if (config.rateLimit !== false) {
        const rateLimitResult = await this.enforceRateLimit(
          config.tenantId,
          config.userId,
          config.operation
        );
        
        if (!rateLimitResult.allowed) {
          metadata.rateLimited = true;
          logger.warn('saas-executor', 'Rate limit exceeded', {
            traceId,
            tenantId: config.tenantId,
            operation: config.operation,
          });
          throw new Error('Rate limit exceeded');
        }
      }

      // STEP 3: Cache Layer (OPTIONAL but encouraged)
      if (config.cache !== false) {
        const cacheKey = config.cacheKey || `${config.tenantId}:${config.key}`;
        const cached = await this.getFromCache<T>(cacheKey);
        
        if (cached !== null) {
          metadata.cached = true;
          metadata.duration = Date.now() - startTime;
          
          logger.info('saas-executor', 'Cache hit', {
            traceId,
            cacheKey,
            duration: metadata.duration,
          });
          
          return {
            success: true,
            data: cached,
            metadata,
          };
        }
      }

      // STEP 4: Execute Query (MANDATORY)
      const result = await this.executeWithTimeout(config.query, 30000);

      // STEP 5: Cache Result (if caching enabled)
      if (config.cache !== false) {
        const cacheKey = config.cacheKey || `${config.tenantId}:${config.key}`;
        await this.setCache(cacheKey, result, config.cacheTTL || 300);
      }

      // STEP 6: Background Hooks (if enabled)
      if (config.backgroundJob) {
        await this.dispatchBackgroundJob(config, result);
      }

      // STEP 7: Success Callback
      if (config.onSuccess) {
        await config.onSuccess(result);
      }

      metadata.duration = Date.now() - startTime;
      this.updateExecutionStats(config.key, metadata.duration, false);

      logger.info('saas-executor', `Execution completed: ${config.operation}`, {
        traceId,
        duration: metadata.duration,
        cached: metadata.cached,
      });

      return {
        success: true,
        data: result,
        metadata,
      };

    } catch (error) {
      metadata.duration = Date.now() - startTime;
      this.updateExecutionStats(config.key, metadata.duration, true);

      logger.error('saas-executor', `Execution failed: ${config.operation}`, error as Error, {
        traceId,
        duration: metadata.duration,
      });

      // Error callback
      if (config.onError) {
        await config.onError(error as Error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata,
      };
    }
  }

  // STEP 1: Tenant Access Enforcement
  private async enforceTenantAccess(tenantId: string, userId: string): Promise<void> {
    if (!tenantId || !userId) {
      throw new Error('Tenant ID and User ID are required');
    }

    const hasAccess = await TenantService.getUserTenantAccess(userId, tenantId);
    if (!hasAccess) {
      throw new Error('User does not have access to this tenant');
    }

    // Check tenant limits
    const tenant = await TenantService.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (tenant.subscription.status !== 'active') {
      throw new Error('Tenant subscription is not active');
    }
  }

  // STEP 2: Rate Limiting Enforcement
  private async enforceRateLimit(
    tenantId: string,
    userId: string,
    operation: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const tenant = await TenantService.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found for rate limiting');
    }

    return TenantRateLimiter.checkUserRateLimit(
      tenantId,
      userId,
      `/api/${operation}`,
      tenant.subscription.plan
    );
  }

  // STEP 3: Cache Layer
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      return await RedisCache.get<T>(key);
    } catch (error) {
      logger.warn('saas-executor', 'Cache get failed', { key, error: String(error) });
      return null;
    }
  }

  private async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await RedisCache.set(key, data, ttl);
    } catch (error) {
      logger.warn('saas-executor', 'Cache set failed', { key, error: String(error) });
    }
  }

  // STEP 4: Query Execution with Timeout
  private async executeWithTimeout<T>(query: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      query()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // STEP 6: Background Job Dispatch
  private async dispatchBackgroundJob<T>(config: SaaSExecutionConfig<T>, result: T): Promise<void> {
    try {
      await backgroundProcessor.addJob({
        type: 'BACKGROUND_HOOK',
        data: {
          operation: config.operation,
          tenantId: config.tenantId,
          userId: config.userId,
          result,
          timestamp: new Date(),
        },
        priority: config.priority || 1,
        tenantId: config.tenantId,
        userId: config.userId,
        timeout: 10000,
        maxAttempts: 3,
      });
    } catch (error) {
      logger.warn('saas-executor', 'Background job dispatch failed', {
        operation: config.operation,
        error: String(error),
      });
    }
  }

  // Execution Statistics
  private updateExecutionStats(key: string, duration: number, error: boolean): void {
    const current = this.executionStats.get(key) || { count: 0, avgDuration: 0, errors: 0 };
    
    current.count++;
    current.avgDuration = (current.avgDuration * (current.count - 1) + duration) / current.count;
    if (error) current.errors++;
    
    this.executionStats.set(key, current);
  }

  // Get execution statistics
  getExecutionStats(): Record<string, { count: number; avgDuration: number; errors: number }> {
    return Object.fromEntries(this.executionStats);
  }

  // Clear execution statistics
  clearExecutionStats(): void {
    this.executionStats.clear();
  }
}

// Export singleton instance - THE ONLY WAY to execute SaaS operations
export const saasExecutor = SaaSExecutor.getInstance();

// Convenience wrapper function - THE ONLY WAY routes should execute operations
export async function saasExecute<T>(config: SaaSExecutionConfig<T>): Promise<SaaSExecutionResult<T>> {
  return saasExecutor.execute(config);
}

// Route-specific wrappers for common operations
export class SaaSRoutes {
  // Standard CRUD operation wrapper
  static async executeCRUD<T>({
    tenantId,
    userId,
    operation,
    key,
    query,
    cache = true,
    rateLimit = true,
  }: {
    tenantId: string;
    userId: string;
    operation: string;
    key: string;
    query: () => Promise<T>;
    cache?: boolean;
    rateLimit?: boolean;
  }): Promise<SaaSExecutionResult<T>> {
    return saasExecute({
      tenantId,
      userId,
      operation,
      key,
      rateLimit,
      cache,
      query,
    });
  }

  // Analytics operation wrapper (always cached)
  static async executeAnalytics<T>({
    tenantId,
    userId,
    operation,
    key,
    query,
    cacheTTL = 600, // 10 minutes
  }: {
    tenantId: string;
    userId: string;
    operation: string;
    key: string;
    query: () => Promise<T>;
    cacheTTL?: number;
  }): Promise<SaaSExecutionResult<T>> {
    return saasExecute({
      tenantId,
      userId,
      operation,
      key,
      cache: true,
      cacheTTL,
      rateLimit: true,
      query,
    });
  }

  // AI operation wrapper (rate limited, cached)
  static async executeAI<T>({
    tenantId,
    userId,
    operation,
    key,
    query,
    priority = 5, // Higher priority for AI operations
  }: {
    tenantId: string;
    userId: string;
    operation: string;
    key: string;
    query: () => Promise<T>;
    priority?: number;
  }): Promise<SaaSExecutionResult<T>> {
    return saasExecute({
      tenantId,
      userId,
      operation,
      key,
      cache: true,
      cacheTTL: 1800, // 30 minutes for AI results
      rateLimit: true,
      backgroundJob: true,
      priority,
      query,
    });
  }

  // Background operation wrapper
  static async executeBackground<T>({
    tenantId,
    userId,
    operation,
    key,
    query,
    priority = 1,
  }: {
    tenantId: string;
    userId: string;
    operation: string;
    key: string;
    query: () => Promise<T>;
    priority?: number;
  }): Promise<SaaSExecutionResult<T>> {
    return saasExecute({
      tenantId,
      userId,
      operation,
      key,
      cache: false,
      rateLimit: false, // Background jobs usually have their own rate limiting
      backgroundJob: true,
      priority,
      query,
    });
  }
}
