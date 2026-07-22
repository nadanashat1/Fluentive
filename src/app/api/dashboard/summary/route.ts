import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';
import { LeadStatus, DealStage } from '@prisma/client';
import { subDays, startOfDay } from 'date-fns';
import { Roles, RoleType } from '@/constants/roles';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });

    const isAdmin = user.role === Roles.ADMIN || user.role === 'ADMIN' || user.role === 'MANAGER';
    const where: any = { 
      organizationId: orgId,
      isDeleted: false,
      ...(isAdmin ? {} : { userId: user.id })
    };

    // 1. Leads Statistics & Aggregations
    const sevenDaysAgo = subDays(new Date(), 7);
    
    const [
      totalLeads, 
      convertedLeads,
      statusCounts,
      sourceCounts,
      dailyLeads
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: LeadStatus.CONVERTED } }),
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { _all: true }
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: { _all: true }
      }),
      prisma.lead.findMany({
        where: {
          ...where,
          createdAt: { gte: sevenDaysAgo }
        },
        select: { createdAt: true }
      })
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // 2. Deals Statistics (Active = Discovery, Qualification, Proposal, Negotiation)
    const activeStages = [DealStage.DISCOVERY, DealStage.QUALIFICATION, DealStage.PROPOSAL, DealStage.NEGOTIATION, DealStage.OPEN];
    const [activeDealsCount, pipelineAggregation] = await Promise.all([
      prisma.deal.count({ where: { ...where, stage: { in: activeStages as any } } }),
      prisma.deal.aggregate({
        where: { ...where, stage: { in: activeStages as any } },
        _sum: { value: true }
      })
    ]);

    // 3. Recent Activity
    const recentActivities = await prisma.activity.findMany({
      where: {
        organizationId: orgId,
        ...(isAdmin ? {} : { userId: user.id })
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true } }
      }
    });

    // Format daily leads for chart
    const dailyMap = new Map();
    for (let i = 0; i < 7; i++) {
      const date = startOfDay(subDays(new Date(), i)).toISOString();
      dailyMap.set(date, 0);
    }
    
    dailyLeads.forEach(l => {
      const date = startOfDay(l.createdAt).toISOString();
      if (dailyMap.has(date)) {
        dailyMap.set(date, dailyMap.get(date) + 1);
      }
    });

    const dailyLeadsFormatted = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const dashboardData = {
      totalLeads,
      convertedLeads,
      activeDeals: activeDealsCount,
      pipelineValue: pipelineAggregation._sum.value || 0,
      conversionRate,
      byStatus: statusCounts.map(s => ({ status: s.status, count: s._count._all })),
      bySource: sourceCounts.map(s => ({ source: s.source || 'Unknown', count: s._count._all })),
      dailyLeads: dailyLeadsFormatted,
      recentActivity: recentActivities.map(a => ({
        id: a.id,
        type: a.type,
        description: a.description,
        createdAt: a.createdAt,
        user: a.user?.name || 'System'
      }))
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('[Dashboard Summary API] GET failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary' 
    }, { status: 500 });
  }
}
