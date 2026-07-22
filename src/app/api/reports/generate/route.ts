// Legacy BI report builders — typed for strict TS without changing runtime behavior.
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import type { User as ReportUser } from '@/types';
import { requireAuth } from '@/lib/server/middleware/auth';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { logSecurityEvent } from '@/lib/server/security-audit';
import { Roles, RoleType } from '@/constants/roles';

/** Loose Prisma where merge from client filters (legacy). */
type ReportWhereExtras = Record<string, unknown>;

/** Request body from POST /api/reports/generate (partial; extra keys ignored). */
type GenerateReportBody = {
  reportType?: string;
  format?: string;
  filters?: ReportWhereExtras;
  dateRange?: { startDate?: string; endDate?: string };
  includeCharts?: boolean;
};

type SalesPipelineLead = Prisma.LeadGetPayload<{
  include: {
    deals: { include: { activities: true }; where: { isDeleted: false } };
    activities: true;
    owner: { select: { id: true; name: true; email: true } };
  };
}>;

type LeadConversionLead = Prisma.LeadGetPayload<{
  include: {
    deals: { where: { isDeleted: false } };
    activities: true;
  };
}>;

type UserPerformanceRow = Prisma.UserGetPayload<{
  include: {
    leads: {
      where: { createdAt: { gte: Date; lte: Date }; isDeleted: false };
      include: { deals: { where: { isDeleted: false } } };
    };
    activities: { where: { createdAt: { gte: Date; lte: Date } } };
  };
}>;

type RevenueDealRow = Prisma.DealGetPayload<{
  include: {
    lead: { select: { id: true; name: true } };
    owner: { select: { id: true; name: true } };
  };
}>;

type ActivitySummaryRow = Prisma.ActivityGetPayload<{
  include: {
    user: { select: { id: true; name: true } };
    lead: { select: { id: true; name: true } };
  };
}>;

type ConversionMonthBucket = { total: number; converted: number };
type RevenueMonthBucket = { total: number; won: number; pending: number; lost: number };

/**
 * Advanced Reports Generation API
 * Supports multiple report types and export formats
 * Implements comprehensive business intelligence features
 */

export async function POST(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        const body = (await request.json()) as GenerateReportBody;

        const {
          reportType,
          format = 'json',
          filters = {},
          dateRange,
          includeCharts = false
        } = body;
        
        if (!reportType) {
          return createCompressedResponse({
            success: false,
            error: 'Report type is required'
          }, 400);
        }
        
        // Parse date range
        const { startDate, endDate } = dateRange || {};
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Generate report based on type
        let reportData;
        
        switch (reportType) {
          case 'sales_pipeline':
            reportData = await generateSalesPipelineReport(user, start, end, filters);
            break;
          case 'lead_conversion':
            reportData = await generateLeadConversionReport(user, start, end, filters);
            break;
          case 'user_performance':
            reportData = await generateUserPerformanceReport(user, start, end, filters);
            break;
          case 'revenue_analytics':
            reportData = await generateRevenueAnalyticsReport(user, start, end, filters);
            break;
          case 'activity_summary':
            reportData = await generateActivitySummaryReport(user, start, end, filters);
            break;
          case 'custom':
            reportData = await generateCustomReport(user, start, end, filters);
            break;
          default:
            return createCompressedResponse({
              success: false,
              error: 'Invalid report type'
            }, 400);
        }
        
        // Format the report based on requested format
        let formattedReport;
        let contentType = 'application/json';
        let filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}`;
        
        switch (format) {
          case 'csv':
            formattedReport = convertToCSV(reportData);
            contentType = 'text/csv';
            filename += '.csv';
            break;
          case 'excel':
            formattedReport = convertToExcel(reportData);
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename += '.xlsx';
            break;
          case 'pdf':
            formattedReport = await convertToPDF(reportData, includeCharts);
            contentType = 'application/pdf';
            filename += '.pdf';
            break;
          default:
            formattedReport = reportData;
            contentType = 'application/json';
            filename += '.json';
        }
        
        await withTimeout(
          logSecurityEvent(request, {
            userId: user.id,
            email: user.email,
            action: 'REPORT_GENERATED',
            meta: {
              reportType,
              format,
              dateRange: { startDate, endDate },
              filters
            }
          }),
          5000
        );
        
        // Return the report
        if (format === 'json') {
          return createCompressedResponse({
            success: true,
            data: {
              report: formattedReport,
              metadata: {
                type: reportType,
                format,
                generatedAt: new Date().toISOString(),
                dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
                recordCount: getRecordCount(formattedReport)
              }
            }
          });
        } else {
          // For binary formats, return as direct download
          const buffer = formattedReport as Buffer;
          return new Response(buffer.toString('base64'), {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache',
              'Content-Transfer-Encoding': 'base64'
            }
          });
        }
        
      } catch (error) {
        console.error('Report generation error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate report'
        }, 500);
      }
    }), { endpoint: 'reports-generate' }
  )(request);
}

// Report generation functions
async function generateSalesPipelineReport(
  user: ReportUser,
  startDate: Date,
  endDate: Date,
  filters: ReportWhereExtras
) {
  const leads: SalesPipelineLead[] = await withTimeout(
    prisma.lead.findMany({
      where: {
        userId: user.role === Roles.ADMIN ? {} : user.id,
        createdAt: { gte: startDate, lte: endDate },
        isDeleted: false,
        ...filters
      } as Prisma.LeadWhereInput,
      include: {
        deals: {
          where: { isDeleted: false },
          include: {
            activities: true
          }
        },
        activities: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    15000
  );

  // Calculate pipeline metrics
  const pipelineStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  const stageDistribution = pipelineStages.map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.status === stage).length,
    value: leads
      .filter((lead) => lead.status === stage)
      .reduce(
        (sum: number, lead) =>
          sum +
          (lead.deals?.reduce((dealSum: number, deal) => dealSum + (deal.value || 0), 0) || 0),
        0
      )
  }));

  const conversionRates: { from: string; to: string; rate: number }[] = [];
  for (let i = 0; i < pipelineStages.length - 1; i++) {
    const currentStage = pipelineStages[i];
    const nextStage = pipelineStages[i + 1];
    const currentCount = leads.filter((lead) => lead.status === currentStage).length;
    const nextCount = leads.filter((lead) => lead.status === nextStage).length;

    conversionRates.push({
      from: currentStage,
      to: nextStage,
      rate: currentCount > 0 ? (nextCount / currentCount) * 100 : 0
    });
  }

  return {
    title: 'Sales Pipeline Report',
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    summary: {
      totalLeads: leads.length,
      totalValue: leads.reduce(
        (sum: number, lead) =>
          sum +
          (lead.deals?.reduce((dealSum: number, deal) => dealSum + (deal.value || 0), 0) || 0),
        0
      ),
      averageDealSize:
        leads.length > 0
          ? leads.reduce(
              (sum: number, lead) =>
                sum +
                (lead.deals?.reduce((dealSum: number, deal) => dealSum + (deal.value || 0), 0) || 0),
              0
            ) / leads.length
          : 0
    },
    pipeline: {
      stageDistribution,
      conversionRates,
      bottlenecks: conversionRates.filter((rate) => rate.rate < 20).map((rate) => rate.from)
    },
    details: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      status: lead.status,
      value: lead.deals?.reduce((sum: number, deal) => sum + (deal.value || 0), 0) || 0,
      createdAt: lead.createdAt,
      owner: lead.owner?.name,
      activities: lead.activities?.length || 0,
      deals: lead.deals?.length || 0
    }))
  };
}

async function generateLeadConversionReport(
  user: ReportUser,
  startDate: Date,
  endDate: Date,
  filters: ReportWhereExtras
) {
  const leads: LeadConversionLead[] = await withTimeout(
    prisma.lead.findMany({
      where: {
        userId: user.role === Roles.ADMIN ? {} : user.id,
        createdAt: { gte: startDate, lte: endDate },
        isDeleted: false,
        ...filters
      } as Prisma.LeadWhereInput,
      include: {
        deals: {
          where: { isDeleted: false }
        },
        activities: true
      }
    }),
    15000
  );

  const convertedLeads = leads.filter((lead) => lead.deals?.some((deal) => deal.stage === 'WON'));

  const conversionByMonth: Record<string, ConversionMonthBucket> = {};
  leads.forEach((lead) => {
    const month = lead.createdAt.toISOString().substring(0, 7);
    if (!conversionByMonth[month]) {
      conversionByMonth[month] = { total: 0, converted: 0 };
    }
    conversionByMonth[month].total++;
    if (lead.deals?.some((deal) => deal.stage === 'WON')) {
      conversionByMonth[month].converted++;
    }
  });

  const monthlyConversionRates = Object.entries(conversionByMonth).map(([month, data]) => ({
    month,
    totalLeads: data.total,
    convertedLeads: data.converted,
    conversionRate: data.total > 0 ? (data.converted / data.total) * 100 : 0
  }));

  return {
    title: 'Lead Conversion Report',
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    summary: {
      totalLeads: leads.length,
      convertedLeads: convertedLeads.length,
      overallConversionRate: leads.length > 0 ? (convertedLeads.length / leads.length) * 100 : 0,
      averageTimeToConvert: calculateAverageTimeToConvert(convertedLeads)
    },
    monthlyTrends: monthlyConversionRates,
    topPerformingLeads: convertedLeads
      .sort(
        (a, b) =>
          (b.deals?.reduce((sum: number, deal) => sum + (deal.value || 0), 0) || 0) -
          (a.deals?.reduce((sum: number, deal) => sum + (deal.value || 0), 0) || 0)
      )
      .slice(0, 10)
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        value: lead.deals?.reduce((sum: number, deal) => sum + (deal.value || 0), 0) || 0,
        conversionTime: calculateConversionTime(lead)
      }))
  };
}

async function generateUserPerformanceReport(
  user: ReportUser,
  startDate: Date,
  endDate: Date,
  filters: ReportWhereExtras
) {
  void filters;
  const users: UserPerformanceRow[] = await withTimeout(
    prisma.user.findMany({
      where: user.role === Roles.ADMIN ? {} : { id: user.id },
      include: {
        leads: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
            isDeleted: false
          },
          include: {
            deals: {
              where: { isDeleted: false }
            }
          }
        },
        activities: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }
      }
    }),
    15000
  );

  return {
    title: 'User Performance Report',
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    summary: {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.leads.length > 0).length
    },
    userPerformance: users
      .map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        metrics: {
          leadsCreated: row.leads.length,
          dealsCreated: row.leads.reduce((sum: number, lead) => sum + (lead.deals?.length || 0), 0),
          activitiesPerformed: row.activities.length,
          totalValue: row.leads.reduce(
            (sum: number, lead) =>
              sum +
              (lead.deals?.reduce((dealSum: number, deal) => dealSum + (deal.value || 0), 0) || 0),
            0
          ),
          conversionRate:
            row.leads.length > 0
              ? (row.leads.filter((lead) => lead.deals?.some((deal) => deal.stage === 'WON')).length /
                  row.leads.length) *
                100
              : 0
        }
      }))
      .sort((a, b) => b.metrics.totalValue - a.metrics.totalValue)
  };
}

async function generateRevenueAnalyticsReport(
  user: ReportUser,
  startDate: Date,
  endDate: Date,
  filters: ReportWhereExtras
) {
  const deals: RevenueDealRow[] = await withTimeout(
    prisma.deal.findMany({
      where: {
        userId: user.role === Roles.ADMIN ? {} : user.id,
        createdAt: { gte: startDate, lte: endDate },
        isDeleted: false,
        ...filters
      } as Prisma.DealWhereInput,
      include: {
        lead: {
          select: { id: true, name: true }
        },
        owner: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    15000
  );

  const wonDeals = deals.filter((deal) => deal.stage === 'WON');
  const revenueByMonth: Record<string, RevenueMonthBucket> = {};

  deals.forEach((deal) => {
    const month = deal.createdAt.toISOString().substring(0, 7);
    if (!revenueByMonth[month]) {
      revenueByMonth[month] = { total: 0, won: 0, pending: 0, lost: 0 };
    }
    revenueByMonth[month].total += deal.value || 0;

    if (deal.stage === 'WON') revenueByMonth[month].won += deal.value || 0;
    else if (deal.stage === 'LOST') revenueByMonth[month].lost += deal.value || 0;
    else revenueByMonth[month].pending += deal.value || 0;
  });

  const monthlyRevenue = Object.entries(revenueByMonth).map(([month, data]) => ({
    month,
    totalPipeline: data.total,
    wonRevenue: data.won,
    pendingRevenue: data.pending,
    lostRevenue: data.lost,
    winRate: data.total > 0 ? (data.won / data.total) * 100 : 0
  }));

  return {
    title: 'Revenue Analytics Report',
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    summary: {
      totalPipeline: deals.reduce((sum: number, deal) => sum + (deal.value || 0), 0),
      wonRevenue: wonDeals.reduce((sum: number, deal) => sum + (deal.value || 0), 0),
      averageDealSize:
        deals.length > 0
          ? deals.reduce((sum: number, deal) => sum + (deal.value || 0), 0) / deals.length
          : 0,
      winRate: deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
    },
    monthlyRevenue,
    topDeals: deals
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 10)
      .map((deal) => ({
        id: deal.id,
        name: (deal as RevenueDealRow & { name?: string | null }).name,
        value: deal.value,
        stage: deal.stage,
        leadName: deal.lead?.name,
        userName: deal.owner?.name,
        createdAt: deal.createdAt
      }))
  };
}

async function generateActivitySummaryReport(
  user: ReportUser,
  startDate: Date,
  endDate: Date,
  filters: ReportWhereExtras
) {
  const activities: ActivitySummaryRow[] = await withTimeout(
    prisma.activity.findMany({
      where: {
        userId: user.role === Roles.ADMIN ? {} : user.id,
        createdAt: { gte: startDate, lte: endDate },
        ...filters
      } as Prisma.ActivityWhereInput,
      include: {
        user: {
          select: { id: true, name: true }
        },
        lead: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    15000
  );

  const activityByType: Record<string, number> = {};
  const activityByUser: Record<string, number> = {};

  activities.forEach((activity) => {
    // By type
    if (!activityByType[activity.type]) {
      activityByType[activity.type] = 0;
    }
    activityByType[activity.type]++;

    // By user
    if (!activityByUser[activity.user?.name || 'Unknown']) {
      activityByUser[activity.user?.name || 'Unknown'] = 0;
    }
    activityByUser[activity.user?.name || 'Unknown']++;
  });

  return {
    title: 'Activity Summary Report',
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    summary: {
      totalActivities: activities.length,
      uniqueUsers: Object.keys(activityByUser).length,
      averageActivitiesPerUser:
        Object.keys(activityByUser).length > 0
          ? activities.length / Object.keys(activityByUser).length
          : 0
    },
    activityBreakdown: Object.entries(activityByType).map(([type, count]) => ({
      type,
      count,
      percentage: activities.length > 0 ? (count / activities.length) * 100 : 0
    })),
    userActivity: Object.entries(activityByUser).map(([userName, count]) => ({
      userName,
      count,
      percentage: activities.length > 0 ? (count / activities.length) * 100 : 0
    })),
    recentActivities: activities.slice(0, 20)
  };
}

async function generateCustomReport(
  user: ReportUser,
  startDate: Date,
  endDate: Date,
  filters: ReportWhereExtras
) {
  void user;
  void filters;
  // Implement custom report logic based on user-defined parameters
  return {
    title: 'Custom Report',
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    message: 'Custom report functionality - implement based on specific requirements'
  };
}

// Helper functions
function calculateAverageTimeToConvert(convertedLeads: LeadConversionLead[]): number {
  if (convertedLeads.length === 0) return 0;

  const totalDays = convertedLeads.reduce((sum: number, lead) => {
    return sum + calculateConversionTime(lead);
  }, 0);

  return totalDays / convertedLeads.length;
}

function calculateConversionTime(lead: LeadConversionLead): number {
  const createdDate = new Date(lead.createdAt);
  const firstWonDeal = lead.deals?.find((deal) => deal.stage === 'WON');
  if (!firstWonDeal) return 0;

  const wonDate = new Date(firstWonDeal.createdAt);
  return Math.floor((wonDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
}

function convertToCSV(data: unknown): string {
  void data;
  // Simple CSV conversion - implement based on data structure
  return 'CSV format - implement based on specific report structure';
}

function convertToExcel(data: unknown): Buffer {
  void data;
  // Excel conversion - would need a library like xlsx
  return Buffer.from('Excel format - implement with xlsx library');
}

async function convertToPDF(data: unknown, includeCharts: boolean): Promise<Buffer> {
  void data;
  void includeCharts;
  // PDF conversion - would need a library like puppeteer or jsPDF
  return Buffer.from('PDF format - implement with PDF library');
}

function getRecordCount(data: unknown): number {
  if (typeof data === 'object' && data !== null && 'details' in data) {
    const details = (data as { details?: unknown }).details;
    if (Array.isArray(details)) return details.length;
  }
  if (Array.isArray(data)) return data.length;
  return 0;
}
