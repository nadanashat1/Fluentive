import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/auth';
import { LeadStatus, DealStage } from '@prisma/client';
import { Roles, RoleType } from '@/constants/roles';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === Roles.ADMIN || user.role === 'ADMIN' || user.role === 'admin';
    const userId = user.id;

    // Time ranges
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    const [
      // FINANCE
      totalRevenue,
      prevMonthRevenue,
      totalExpenses,
      pendingInvoices,
      
      // SALES
      activeDeals,
      wonDealsCount,
      pipelineValue,
      
      // HR
      totalEmployees,
      newHiresMonth,
      attendanceRate,
      
      // MARKETING
      totalSpent,
      totalLeads,
      
      // ATS
      activeJobs,
      totalApplications,
    ] = await Promise.all([
      // Finance aggregation
      prisma.invoice.aggregate({ 
        where: { status: 'PAID' }, 
        _sum: { total: true } 
      }),
      prisma.invoice.aggregate({ 
        where: { status: 'PAID', paidDate: { gte: twoMonthsAgo, lt: monthAgo } }, 
        _sum: { total: true } 
      }),
      prisma.expense.aggregate({ 
        where: { status: 'PAID' }, 
        _sum: { amount: true } 
      }),
      prisma.invoice.count({ where: { status: { in: ['SENT', 'OVERDUE'] } } }),

      // Sales aggregation
      prisma.deal.count({ where: { stage: { notIn: ['WON', 'LOST'] } } }),
      prisma.deal.count({ where: { stage: 'WON', updatedAt: { gte: monthAgo } } }),
      prisma.deal.aggregate({ 
        where: { stage: { notIn: ['WON', 'LOST'] } }, 
        _sum: { value: true } 
      }),

      // HR aggregation
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.attendance.count({ where: { date: { gte: monthAgo }, status: 'PRESENT' } }),

      // Marketing aggregation
      prisma.campaign.aggregate({ _sum: { spent: true } }),
      prisma.lead.count({ where: { isDeleted: false } }),

      // ATS aggregation
      prisma.jobPosition.count({ where: { status: 'OPEN' } }),
      prisma.application.count({ where: { appliedAt: { gte: monthAgo } } }),
    ]);

    const revenue = totalRevenue._sum.total || 0;
    const prevRevenue = prevMonthRevenue._sum.total || 0;
    const revGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const expenses = totalExpenses._sum.amount || 0;
    const marketingSpend = totalSpent._sum.spent || 0;
    const cac = totalLeads > 0 ? marketingSpend / totalLeads : 0;
    const roas = marketingSpend > 0 ? revenue / marketingSpend : 0;

    // AI INSIGHTS ENGINE - REAL DATA DRIVEN
    const aiInsights = [
      revenue > expenses ? "Profitability is stable. Cash flow looks healthy." : "Operating expenses are exceeding revenue. Review budget allocations.",
      revGrowth > 10 ? `Exceptional growth! Revenue is up ${revGrowth.toFixed(1)}% vs last month.` : "Revenue growth is steady. Focus on pipeline conversion.",
      cac < 50 ? "Marketing efficiency is high. Consider increasing ad spend." : "Customer Acquisition Cost (CAC) is rising. Optimize campaign attribution.",
      wonDealsCount > 5 ? "Sales velocity is increasing. Rep leaderboard shows high activity." : "Deal closing rate is low. Check pipeline bottlenecks.",
    ];

    return NextResponse.json({
      success: true,
      data: {
        ceo: {
          totalRevenue: revenue,
          monthlyGrowth: Math.round(revGrowth * 10) / 10,
          employeeCount: totalEmployees,
          activeDeals,
          hiringProgress: activeJobs,
          marketingROI: Math.round(roas * 10) / 10,
        },
        finance: {
          revenue,
          expenses,
          netProfit: revenue - expenses,
          outstandingInvoices: pendingInvoices,
          cashFlow: revenue - expenses, // Simplified
        },
        sales: {
          pipelineValue: pipelineValue._sum.value || 0,
          dealsWonMonth: wonDealsCount,
          winRate: 0, // Calculated elsewhere
          conversionFunnel: [totalLeads, activeDeals, wonDealsCount],
        },
        hr: {
          attendanceRate: totalEmployees > 0 ? Math.round((attendanceRate / (totalEmployees * 20)) * 100) : 100, // Assuming 20 working days
          newHires: newHiresMonth,
          activeDepartments: 0, // Placeholder
        },
        marketing: {
          totalSpent: marketingSpend,
          totalLeads,
          cac: Math.round(cac * 100) / 100,
          roas: Math.round(roas * 10) / 10,
        },
        aiInsights,
      }
    });
  } catch (error) {
    console.error('[Analytics API] Failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

