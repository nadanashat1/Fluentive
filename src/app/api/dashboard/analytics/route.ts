import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { withErrorHandler } from '@/lib/server/api-handler';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * EXECUTIVE ANALYTICS API
 * Aggregates live data from CRM, HR, Finance, and Marketing for a unified view.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireUser(request);
  const orgId = user.organizationId;
  if (!orgId) throw new Error('Organization context missing');

  // Parallelize all module aggregations for maximum performance
  const [
    leadStats,
    dealStats,
    revenueStats,
    hrStats,
    atsStats,
    marketingStats
  ] = await Promise.all([
    // 1. CRM - Leads
    prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId: orgId, isDeleted: false },
      _count: true
    }),

    // 2. CRM - Deals / Pipeline
    prisma.deal.aggregate({
      where: { organizationId: orgId, isDeleted: false },
      _sum: { value: true },
      _count: true,
      _avg: { probability: true }
    }),

    // 3. Finance - Revenue (Last 6 Months)
    prisma.invoice.groupBy({
      by: ['issueDate'],
      where: { 
        organizationId: orgId, 
        status: 'PAID',
        issueDate: { gte: subMonths(new Date(), 6) }
      },
      _sum: { total: true }
    }),

    // 4. HR - Employee Growth
    prisma.employee.count({
      where: { organizationId: orgId, status: 'ACTIVE' }
    }),

    // 5. ATS - Recruitment Funnel
    prisma.application.groupBy({
      by: ['status'],
      where: { job: { organizationId: orgId } },
      _count: true
    }),

    // 6. Marketing - Campaign Performance
    prisma.campaign.aggregate({
      where: { organizationId: orgId, isDeleted: false },
      _sum: { budget: true, spent: true, leadsGenerated: true }
    })
  ]);

  // Transform data for Recharts compatibility
  const leadData = leadStats.map(s => ({ name: s.status, value: s._count }));
  const pipelineValue = dealStats._sum.value || 0;
  
  // Format monthly revenue
  const monthlyRevenue = revenueStats.reduce((acc: any, curr) => {
    const month = format(curr.issueDate, 'MMM');
    acc[month] = (acc[month] || 0) + (curr._sum.total || 0);
    return acc;
  }, {});

  const revenueChartData = Object.entries(monthlyRevenue).map(([name, value]) => ({ name, value }));

  return NextResponse.json({
    success: true,
    data: {
      crm: {
        totalLeads: leadStats.reduce((a, b) => a + b._count, 0),
        leadBreakdown: leadData,
        pipelineValue,
        activeDeals: dealStats._count
      },
      finance: {
        revenueChart: revenueChartData,
        totalRevenue: Object.values(monthlyRevenue).reduce((a: any, b: any) => a + b, 0)
      },
      hr: {
        headcount: hrStats,
        hiringPipe: atsStats.length
      },
      marketing: {
        totalSpent: marketingStats._sum.spent || 0,
        leadsGenerated: marketingStats._sum.leadsGenerated || 0,
        cac: (marketingStats._sum.spent || 0) / (marketingStats._sum.leadsGenerated || 1)
      }
    }
  });
});
