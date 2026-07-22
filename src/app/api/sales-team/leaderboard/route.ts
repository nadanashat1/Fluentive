import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoLeaderboard = [
  {
    id: "usr-2",
    name: "Marcus Brody",
    email: "marcus.b@fluentive.com",
    role: "manager",
    revenue: 284000,
    dealsClosed: 24,
    leadsGenerated: 38,
    activityCount: 210,
    score: 974
  },
  {
    id: "usr-4",
    name: "Elena Vance",
    email: "elena.v@fluentive.com",
    role: "sales",
    revenue: 245000,
    dealsClosed: 22,
    leadsGenerated: 51,
    activityCount: 184,
    score: 924
  },
  {
    id: "usr-1",
    name: "Sarah Connor",
    email: "sarah.c@fluentive.com",
    role: "sales",
    revenue: 198000,
    dealsClosed: 18,
    leadsGenerated: 42,
    activityCount: 156,
    score: 768
  },
  {
    id: "usr-3",
    name: "Devon Miles",
    email: "devon.m@fluentive.com",
    role: "sales",
    revenue: 142000,
    dealsClosed: 14,
    leadsGenerated: 29,
    activityCount: 98,
    score: 565
  }
];

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    let startDate = new Date();
    if (range === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (range === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setDate(startDate.getDate() - 30); // Default

    // Get all sales members
    const teamMembers = await prisma.user.findMany({
      where: { 
        isDeleted: false,
        role: { in: ['sales', 'manager', 'admin'] as any[] },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    // Get deals won in period
    const wonDeals = await prisma.deal.findMany({
      where: {
        isDeleted: false,
        stage: 'WON',
        updatedAt: { gte: startDate }
      },
      select: {
        userId: true,
        value: true,
      }
    });

    // Get new leads created in period
    const newLeads = await prisma.lead.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: startDate }
      },
      select: {
        userId: true,
      }
    });

    // Get activities in period
    const activities = await prisma.activity.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: startDate }
      },
      select: {
        userId: true,
      }
    });

    // Aggregate stats per user
    let leaderboard = teamMembers.map((member: any) => {
      const memberWonDeals = wonDeals.filter((d: any) => d.userId === member.id);
      const revenue = memberWonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const dealsClosed = memberWonDeals.length;
      const leadsGenerated = newLeads.filter((l: any) => l.userId === member.id).length;
      const activityCount = activities.filter((a: any) => a.userId === member.id).length;

      const score = activityCount + (leadsGenerated * 5) + (dealsClosed * 20) + Math.floor(revenue / 1000);

      return {
        ...member,
        revenue,
        dealsClosed,
        leadsGenerated,
        activityCount,
        score
      };
    });

    leaderboard.sort((a: any, b: any) => b.score - a.score);

    const totalRevenue = leaderboard.reduce((sum: number, u: any) => sum + u.revenue, 0);

    if (leaderboard.length <= 1 && totalRevenue === 0) {
      leaderboard = [...leaderboard, ...demoLeaderboard];
      leaderboard.sort((a: any, b: any) => b.score - a.score);
    }

    return NextResponse.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('[Sales Leaderboard API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
