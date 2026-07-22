import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { Roles, RoleType } from '@/constants/roles';

/**
 * Analytics Timeseries API
 * Provides comprehensive time-series analytics for leads, deals, activities, and performance metrics
 * Supports multiple time periods and aggregation types
 */

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        
        // Parse and validate parameters - strict limits for memory
        const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7'), 1), 7); // Max 7 days
        const metric = searchParams.get('metric') || 'all';
        const granularity = searchParams.get('granularity') || 'daily';
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 items
        
        // Query guard
        if (limit > 50) {
          return createCompressedResponse({
            success: false,
            error: 'Too many items requested - maximum 50 items allowed'
          }, 400);
        }
        
        const now = new Date();
        const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        
        // Build time series data based on requested metrics
        let timeSeriesData: any[] = [];
        let summary: any = {};
        
        if (metric === 'all' || metric === 'leads') {
          const leadsData = await getLeadsTimeSeries(user.id, startDate, now, granularity, user.role || 'USER');
          timeSeriesData = mergeTimeSeries(timeSeriesData, leadsData, 'leads');
          summary.leads = calculateLeadsSummary(leadsData);
        }
        
        if (metric === 'all' || metric === 'deals') {
          const dealsData = await getDealsTimeSeries(user.id, startDate, now, granularity, user.role || 'USER');
          timeSeriesData = mergeTimeSeries(timeSeriesData, dealsData, 'deals');
          summary.deals = calculateDealsSummary(dealsData);
        }
        
        if (metric === 'all' || metric === 'activities') {
          const activitiesData = await getActivitiesTimeSeries(user.id, startDate, now, granularity, user.role || 'USER');
          timeSeriesData = mergeTimeSeries(timeSeriesData, activitiesData, 'activities');
          summary.activities = calculateActivitiesSummary(activitiesData);
        }
        
        if (metric === 'all' || metric === 'revenue') {
          const revenueData = await getRevenueTimeSeries(user.id, startDate, now, granularity, user.role || 'USER');
          timeSeriesData = mergeTimeSeries(timeSeriesData, revenueData, 'revenue');
          summary.revenue = calculateRevenueSummary(revenueData);
        }
        
        // Sort by date
        timeSeriesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return createCompressedResponse({
          success: true,
          data: {
            series: timeSeriesData,
            period: `${days} days`,
            granularity,
            metric,
            summary,
            generatedAt: new Date().toISOString(),
            dataPoints: timeSeriesData.length
          }
        });
        
      } catch (error) {
        console.error('Analytics timeseries error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch analytics data'
        }, 500);
      }
    }), { endpoint: 'analytics-timeseries' }
  )(request);
}

// Helper functions for time series data generation
async function getLeadsTimeSeries(userId: string, startDate: Date, endDate: Date, granularity: string, userRole: string): Promise<any[]> {
  const leads = await withTimeout(
    (prisma as any).lead.findMany({
      where: {
        userId: userRole === Roles.ADMIN ? {} : userId,
        isDeleted: false,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'asc' },
      take: 30 // Strict pagination limit
    }),
    5000 // Reduced timeout
  );
  
  return aggregateByTimePeriod(leads as any[], granularity, 'leads');
}

async function getDealsTimeSeries(userId: string, startDate: Date, endDate: Date, granularity: string, userRole: string): Promise<any[]> {
  const deals = await withTimeout(
    (prisma as any).deal.findMany({
      where: {
        userId: userRole === Roles.ADMIN ? {} : userId,
        isDeleted: false,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        stage: true,
        value: true
      },
      orderBy: { createdAt: 'asc' },
      take: 20 // Strict pagination limit
    }),
    5000 // Reduced timeout
  );
  
  return aggregateByTimePeriod(deals as any[], granularity, 'deals');
}

async function getActivitiesTimeSeries(userId: string, startDate: Date, endDate: Date, granularity: string, userRole: string): Promise<any[]> {
  const activities = await withTimeout(
    (prisma as any).activity.findMany({
      where: {
        userId: userRole === Roles.ADMIN ? {} : userId,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        type: true
      },
      orderBy: { createdAt: 'asc' },
      take: 25 // Strict pagination limit
    }),
    4000 // Reduced timeout
  );
  
  return aggregateByTimePeriod(activities as any[], granularity, 'activities');
}

async function getRevenueTimeSeries(userId: string, startDate: Date, endDate: Date, granularity: string, userRole: string): Promise<any[]> {
  const deals = await withTimeout(
    (prisma as any).deal.findMany({
      where: {
        userId: userRole === Roles.ADMIN ? {} : userId,
        isDeleted: false,
        createdAt: { gte: startDate, lte: endDate },
        value: { gt: 0 }
      },
      select: {
        createdAt: true,
        value: true,
        stage: true
      },
      orderBy: { createdAt: 'asc' },
      take: 15 // Strict pagination limit
    }),
    3000 // Reduced timeout
  );
  
  return aggregateByTimePeriod(deals as any[], granularity, 'revenue');
}

function aggregateByTimePeriod(data: any[], granularity: string, type: string): any[] {
  const grouped: { [key: string]: any[] } = {};
  
  data.forEach(item => {
    const date = new Date(item.createdAt);
    let key: string;
    
    switch (granularity) {
      case 'hourly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // daily
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });
  
  return Object.entries(grouped).map(([date, items]) => {
    const aggregated: any = { date };
    
    if (type === 'leads') {
      aggregated.leads = items.length;
      aggregated.leadsByStatus = items.reduce((acc: any, lead: any) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});
    } else if (type === 'deals') {
      aggregated.deals = items.length;
      aggregated.dealsByStage = items.reduce((acc: any, deal: any) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1;
        return acc;
      }, {});
      aggregated.totalValue = items.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    } else if (type === 'activities') {
      aggregated.activities = items.length;
      aggregated.activitiesByType = items.reduce((acc: any, activity: any) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {});
    } else if (type === 'revenue') {
      const wonDeals = items.filter((deal: any) => deal.stage === 'WON');
      aggregated.revenue = wonDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
      aggregated.dealsWon = wonDeals.length;
      aggregated.potentialRevenue = items.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    }
    
    return aggregated;
  });
}

function mergeTimeSeries(existing: any[], newData: any[], metricType: string): any[] {
  if (existing.length === 0) return newData;
  
  return existing.map(item => {
    const matchingData = newData.find(d => d.date === item.date);
    if (matchingData) {
      return { ...item, ...matchingData };
    }
    return item;
  });
}

function calculateLeadsSummary(data: any[]): any {
  const totalLeads = data.reduce((sum, item) => sum + (item.leads || 0), 0);
  const avgLeads = totalLeads / data.length || 0;
  
  return {
    total: totalLeads,
    average: Math.round(avgLeads * 100) / 100,
    peak: Math.max(...data.map(item => item.leads || 0)),
    trend: calculateTrend(data.map(item => item.leads || 0))
  };
}

function calculateDealsSummary(data: any[]): any {
  const totalDeals = data.reduce((sum, item) => sum + (item.deals || 0), 0);
  const totalValue = data.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  
  return {
    total: totalDeals,
    totalValue: Math.round(totalValue * 100) / 100,
    averageValue: totalDeals > 0 ? Math.round((totalValue / totalDeals) * 100) / 100 : 0,
    trend: calculateTrend(data.map(item => item.deals || 0))
  };
}

function calculateActivitiesSummary(data: any[]): any {
  const totalActivities = data.reduce((sum, item) => sum + (item.activities || 0), 0);
  const avgActivities = totalActivities / data.length || 0;
  
  return {
    total: totalActivities,
    average: Math.round(avgActivities * 100) / 100,
    peak: Math.max(...data.map(item => item.activities || 0)),
    trend: calculateTrend(data.map(item => item.activities || 0))
  };
}

function calculateRevenueSummary(data: any[]): any {
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const dealsWon = data.reduce((sum, item) => sum + (item.dealsWon || 0), 0);
  
  return {
    total: Math.round(totalRevenue * 100) / 100,
    dealsWon,
    averagePerDeal: dealsWon > 0 ? Math.round((totalRevenue / dealsWon) * 100) / 100 : 0,
    trend: calculateTrend(data.map(item => item.revenue || 0))
  };
}

function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'stable';
}
