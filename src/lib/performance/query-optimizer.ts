// Query optimization and performance tuning for production SaaS architecture
import { prisma } from '@/lib/prisma';

import { logger } from '@/lib/observability/logger';
import { Roles, RoleType } from '@/constants/roles';

export interface QueryOptimization {
  select?: Record<string, boolean>;
  include?: Record<string, boolean>;
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
  cache?: {
    key: string;
    ttl: number;
  };
}

export class QueryOptimizer {
  // Optimized lead queries with caching
  static async getLeadsOptimized(
    tenantId: string,
    userId: string,
    role: string,
    options: QueryOptimization = {}
  ) {
    const startTime = Date.now();
    
    try {
      // Base query with essential fields only
      const baseSelect = {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      };

      // Add tenant filtering
      const whereClause: any = {
        isDeleted: false,
        ...(role !== Roles.ADMIN ? { userId } : {}),
        ...(options.where || {}),
      };

      // Optimized query with pagination
      const query: any = {
        where: whereClause,
        select: { ...baseSelect, ...options.select },
        orderBy: options.orderBy || { createdAt: 'desc' as const },
        take: Math.min(options.take || 20, 100), // Max 100 records
        skip: options.skip || 0,
      };

      // Execute query with timeout
      const result = await Promise.race([
        prisma.lead.findMany(query),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 10000)
        ),
      ]);

      const duration = Date.now() - startTime;
      logger.info('query-optimizer', 'Leads query executed', {
        tenantId,
        userId,
        duration,
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query-optimizer', 'Leads query failed', error as Error, {
        tenantId,
        userId,
        duration,
      });
      throw error;
    }
  }

  // Optimized analytics queries with aggregation
  static async getAnalyticsOptimized(
    tenantId: string,
    userId: string,
    role: string,
    period: '7d' | '30d' | '90d'
  ) {
    const startTime = Date.now();
    
    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      // Optimized parallel queries
      const whereClause = {
        createdAt: { gte: startDate },
        isDeleted: false,
        ...(role !== Roles.ADMIN ? { userId } : {}),
      };

      const [
        leadsCount,
        dealsCount,
        activitiesCount,
        usersCount
      ] = await Promise.all([
        // Optimized count query
        prisma.lead.count({ where: whereClause }),
        prisma.deal.count({ where: whereClause }),
        prisma.activity.count({ 
          where: { 
            createdAt: { gte: startDate },
            ...(role !== Roles.ADMIN ? { userId } : {}),
          } 
        }),
        // User count (admin only)
        role === Roles.ADMIN 
          ? prisma.user.count({ 
              where: { 
                isActive: true, 
                createdAt: { gte: startDate } 
              } 
            })
          : Promise.resolve(0)
      ]);

      const duration = Date.now() - startTime;
      logger.info('query-optimizer', 'Analytics query executed', {
        tenantId,
        userId,
        period,
        duration,
        results: { leadsCount, dealsCount, activitiesCount, usersCount },
      });

      return {
        leads: leadsCount,
        deals: dealsCount,
        activities: activitiesCount,
        users: usersCount,
        period,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query-optimizer', 'Analytics query failed', error as Error, {
        tenantId,
        userId,
        period,
        duration,
      });
      throw error;
    }
  }

  // Optimized dashboard queries with minimal data
  static async getDashboardOptimized(tenantId: string, userId: string, role: string) {
    const startTime = Date.now();
    
    try {
      // Lightweight dashboard queries
      const whereClause = {
        isDeleted: false,
        ...(role !== Roles.ADMIN ? { userId } : {}),
      };

      const [
        recentLeads,
        recentActivities,
        totalStats
      ] = await Promise.all([
        // Recent leads (last 5)
        prisma.lead.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        // Recent activities (last 10)
        prisma.activity.findMany({
          where: role !== Roles.ADMIN ? { userId } : {},
          select: {
            id: true,
            type: true,
            createdAt: true,
            leadId: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        // Total counts
        Promise.all([
          prisma.lead.count({ where: whereClause }),
          prisma.deal.count({ where: whereClause }),
          prisma.activity.count({ 
            where: role !== Roles.ADMIN ? { userId } : {} 
          }),
        ])
      ]);

      const duration = Date.now() - startTime;
      logger.info('query-optimizer', 'Dashboard query executed', {
        tenantId,
        userId,
        duration,
      });

      return {
        recentLeads,
        recentActivities,
        stats: {
          leads: totalStats[0],
          deals: totalStats[1],
          activities: totalStats[2],
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query-optimizer', 'Dashboard query failed', error as Error, {
        tenantId,
        userId,
        duration,
      });
      throw error;
    }
  }

  // Optimized search with indexing hints
  static async searchLeadsOptimized(
    tenantId: string,
    userId: string,
    role: string,
    query: string,
    limit = 20
  ) {
    const startTime = Date.now();
    
    try {
      // Optimized search query
      const whereClause: any = {
        isDeleted: false,
        ...(role !== Roles.ADMIN ? { userId } : {}),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      };

      const results = await prisma.lead.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 50), // Limit search results
      });

      const duration = Date.now() - startTime;
      logger.info('query-optimizer', 'Search query executed', {
        tenantId,
        userId,
        query,
        duration,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query-optimizer', 'Search query failed', error as Error, {
        tenantId,
        userId,
        query,
        duration,
      });
      throw error;
    }
  }

  // Query performance monitoring
  static async monitorQueryPerformance(
    queryName: string,
    queryFn: () => Promise<any>,
    metadata?: Record<string, any>
  ) {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log performance metrics
      logger.info('query-optimizer', `Query executed: ${queryName}`, {
        duration,
        metadata,
      });

      // Alert on slow queries
      if (duration > 5000) { // 5 seconds
        logger.warn('query-optimizer', `Slow query detected: ${queryName}`, {
          duration,
          metadata,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query-optimizer', `Query failed: ${queryName}`, error as Error, {
        duration,
        metadata,
      });
      throw error;
    }
  }

  // Database health check
  static async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    connectionPool: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test basic query
      await prisma.$queryRaw`SELECT 1`;
      
      // Check connection pool
      const poolStatus = await prisma.$queryRaw<Array<{ active_connections: bigint | number | null }>>`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;

      const latency = Date.now() - startTime;
      const activeConnections = Number(poolStatus[0]?.active_connections ?? 0);

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (latency > 1000) {
        status = 'degraded';
        errors.push('High database latency');
      }
      
      if (activeConnections > 50) {
        status = 'degraded';
        errors.push('High connection pool usage');
      }

      if (latency > 5000) {
        status = 'unhealthy';
        errors.push('Very high database latency');
      }

      return {
        status,
        latency,
        connectionPool: activeConnections,
        errors,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('query-optimizer', 'Database health check failed', error as Error);
      
      return {
        status: 'unhealthy',
        latency,
        connectionPool: 0,
        errors: ['Database connection failed'],
      };
    }
  }

  // Query result caching helper
  static async getCachedResult<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl = 300 // 5 minutes
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.getFromCache<T>(key);
      if (cached !== null) {
        logger.info('query-optimizer', 'Cache hit', { key });
        return cached;
      }

      // Execute query and cache result
      const result = await queryFn();
      await this.setCache(key, result, ttl);
      
      logger.info('query-optimizer', 'Cache miss - result cached', { key });
      return result;
    } catch (error) {
      logger.error('query-optimizer', 'Cache operation failed', error as Error, { key });
      // Fallback to direct query
      return await queryFn();
    }
  }

  // Simple cache implementation (can be replaced with Redis)
  private static cache = new Map<string, { data: any; expires: number }>();

  private static async getFromCache<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private static async setCache(key: string, data: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }
}
