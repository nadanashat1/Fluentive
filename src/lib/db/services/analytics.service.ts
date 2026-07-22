// Database service layer abstraction for analytics
import { prisma } from '@/lib/prisma';

import { getOrSetCache, CacheKeys } from '@/lib/cache/redis-cache';
import { Roles, RoleType } from '@/constants/roles';

export class AnalyticsService {
  // Get dashboard stats with caching
  static async getDashboardStats(userId: string, role: string, timeframe = '30d') {
    const cacheKey = CacheKeys.DASHBOARD_STATS(userId);
    
    return getOrSetCache(cacheKey, async () => {
      const now = new Date();
      
      let startDate: Date;
      
      switch (timeframe) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const whereClause: any = { createdAt: { gte: startDate }, isDeleted: false };
      
      if (role !== Roles.ADMIN) {
        whereClause.userId = userId;
      }
      
      // Get counts efficiently
      const [
        usersCount,
        leadsCount,
        dealsCount,
        activitiesCount
      ] = await Promise.all([
        prisma.user.count({
          where: { isActive: true, createdAt: { gte: startDate } }
        }),
        prisma.lead.count(whereClause),
        prisma.deal.count(whereClause),
        prisma.activity.count({
          where: { createdAt: { gte: startDate } }
        })
      ]);
      
      return {
        users: usersCount,
        leads: leadsCount,
        deals: dealsCount,
        activities: activitiesCount,
        timeframe,
        generatedAt: new Date().toISOString()
      };
    }, 300); // 5 minute cache
  }

  // Get timeseries data with caching
  static async getTimeseriesData(userId: string, role: string, period = '30d') {
    const cacheKey = CacheKeys.ANALYTICS_DATA(period);
    
    return getOrSetCache(cacheKey, async () => {
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
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const whereClause: any = { createdAt: { gte: startDate }, isDeleted: false };
      
      if (role !== Roles.ADMIN) {
        whereClause.userId = userId;
      }
      
      // Get aggregated data
      const leads = await prisma.lead.findMany({
        where: whereClause,
        select: {
          createdAt: true,
          status: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Aggregate by day
      const dailyData = leads.reduce((acc: any, lead: any) => {
        const day = lead.createdAt.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = { NEW: 0, CONTACTED: 0, QUALIFIED: 0, CONVERTED: 0 };
        }
        acc[day][lead.status]++;
        return acc;
      }, {});
      
      return {
        period,
        dailyData,
        totalLeads: leads.length,
        generatedAt: new Date().toISOString()
      };
    }, 600); // 10 minute cache
  }

  // Get user activity summary
  static async getUserActivitySummary(userId: string, days = 30) {
    const cacheKey = `user:activity:${userId}:${days}`;
    
    return getOrSetCache(cacheKey, async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const [activities, leads, deals] = await Promise.all([
        prisma.activity.count({
          where: { userId, createdAt: { gte: startDate } }
        }),
        prisma.lead.count({
          where: { userId, createdAt: { gte: startDate }, isDeleted: false }
        }),
        prisma.deal.count({
          where: { userId, createdAt: { gte: startDate }, isDeleted: false }
        })
      ]);
      
      return {
        activities,
        leads,
        deals,
        period: `${days}d`,
        generatedAt: new Date().toISOString()
      };
    }, 1800); // 30 minute cache
  }
}
