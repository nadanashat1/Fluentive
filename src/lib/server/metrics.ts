import { db } from '@/lib/prisma-safe';

interface MetricData {
  route: string;
  duration: number;
  status: number;
  timestamp?: Date;
}

interface MetricStats {
  avgResponseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  totalRequests: number;
  errorCount: number;
}

export class MetricsService {
  static async track(data: MetricData): Promise<void> {
    try {
      await db.metric.create({
        data: {
          route: data.route,
          duration: data.duration,
          status: data.status,
          timestamp: data.timestamp || new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to track metric:', error);
    }
  }

  static async getStats(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<MetricStats> {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    try {
      const [metrics, totalRequests, errorCount] = await Promise.all([
        db.metric.findMany({
          where: {
            timestamp: {
              gte: startTime,
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        }),
        db.metric.count({
          where: {
            timestamp: {
              gte: startTime,
            },
          },
        }),
        db.metric.count({
          where: {
            timestamp: {
              gte: startTime,
            },
            status: {
              gte: 400,
            },
          },
        }),
      ]);

      if (metrics.length === 0) {
        return {
          avgResponseTime: 0,
          errorRate: 0,
          requestsPerMinute: 0,
          totalRequests: 0,
          errorCount: 0,
        };
      }

      const avgResponseTime = metrics.reduce((sum: number, m: any) => sum + m.duration, 0) / metrics.length;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      const timeRangeMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
      const requestsPerMinute = totalRequests / timeRangeMinutes;

      return {
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
        totalRequests,
        errorCount,
      };
    } catch (error) {
      console.error('Failed to get metrics stats:', error);
      return {
        avgResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        totalRequests: 0,
        errorCount: 0,
      };
    }
  }

  static async getTopRoutes(limit: number = 10): Promise<Array<{ route: string; count: number; avgDuration: number }>> {
    try {
      const routes = await db.metric.groupBy({
        by: ['route'],
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        _count: {
          route: true,
        },
        _avg: {
          duration: true,
        },
        orderBy: {
          _count: {
            route: 'desc',
          },
        },
        take: limit,
      });

      return routes.map((route: any) => ({
        route: route.route,
        count: route._count.route,
        avgDuration: Math.round(route._avg.duration || 0),
      }));
    } catch (error) {
      console.error('Failed to get top routes:', error);
      return [];
    }
  }

  static async cleanup(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      await db.metric.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }
}
