import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get time tracking summary
    const timeTrackingData = await prisma.timeTracking.groupBy({
      by: ['date'],
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      _sum: {
        totalSeconds: true,
        activeSeconds: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Get activity summary
    const activityCount = await prisma.activity.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    });

    const summary = {
      period,
      totalHours: timeTrackingData.reduce((acc: number, entry: any) => acc + (entry._sum.totalSeconds || 0), 0) / 3600,
      activeHours: timeTrackingData.reduce((acc: number, entry: any) => acc + (entry._sum.activeSeconds || 0), 0) / 3600,
      totalActivities: activityCount,
      dailyBreakdown: timeTrackingData.map((entry: any) => ({
        date: entry.date,
        hours: (entry._sum.totalSeconds || 0) / 3600,
        activeHours: (entry._sum.activeSeconds || 0) / 3600,
      })),
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Time tracking summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time tracking summary' },
      { status: 500 }
    );
  }
}
