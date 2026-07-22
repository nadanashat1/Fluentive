import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { ApiWrapper, withApiHandler } from '@/lib/server/middleware/api-wrapper';
import { Schemas } from '@/lib/server/validation/schemas';
import { prisma } from '@/lib/prisma';
import { Roles, RoleType } from '@/constants/roles';


const isDev = process.env.NODE_ENV === 'development';

export const GET = withApiHandler(
  async (request: Request | NextRequest) => {
    if (isDev) console.log('[API Leads Stats] GET request received');
    
    const { user, error } = await requireAuth(request as NextRequest);
    if (error || !user) {
      return ApiWrapper.json({ error: 'User not authenticated' }, 401);
    }
    if (isDev) console.log('[API Leads Stats] User authenticated:', user.id);
    
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryParams = Schemas.LeadStatsQuery.parse({
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      groupBy: searchParams.get('groupBy') || 'month',
      metric: searchParams.get('metric') || 'count'
    });

    // Build where clause for date filtering
    const whereClause: any = {
      isDeleted: false
    };
    
    // Apply role-based filtering
    if (user.role !== Roles.ADMIN) {
      whereClause.userId = user.id;
    }
    
    // Apply date range filter
    if (queryParams.startDate || queryParams.endDate) {
      whereClause.createdAt = {};
      if (queryParams.startDate) {
        whereClause.createdAt.gte = queryParams.startDate;
      }
      if (queryParams.endDate) {
        whereClause.createdAt.lte = queryParams.endDate;
      }
    }

    // Get total counts by status
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    // Get total count
    const totals = await prisma.lead.aggregate({
      where: whereClause,
      _count: {
        id: true
      }
    });

    // Get trends based on groupBy parameter using Prisma groupBy
    let trends: any[] = [];

    const trendData = await prisma.lead.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // Build monthly trend from individual leads
    const recentLeads = await prisma.lead.findMany({
      where: whereClause,
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    // Group by month for trends
    const monthMap = new Map<string, { count: number; value: number }>();
    recentLeads.forEach((lead: any) => {
      const monthKey = lead.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const existing = monthMap.get(monthKey) || { count: 0, value: 0 };
      existing.count++;
      monthMap.set(monthKey, existing);
    });

    trends = Array.from(monthMap.entries())
      .map(([date, data]) => ({ date, count: data.count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);

    // Format response data
    const byStatus = statusCounts.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item._count?.id || 0;
      return acc;
    }, {} as Record<string, number>);

    const formattedTrends = trends.map((trend: any) => ({
      date: new Date(trend.date).toISOString().split('T')[0],
      count: parseInt(trend.count),
      value: queryParams.metric === 'value' && trend.value ? parseFloat(trend.value) : undefined
    }));

    const statsData = {
      total: totals._count?.id || 0,
      byStatus,
      trends: formattedTrends
    };

    return ApiWrapper.json(statsData, 200);
  }
);
