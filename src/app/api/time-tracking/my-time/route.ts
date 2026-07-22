import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/auth';

/**
 * Get user's time tracking data
 * Returns all time tracking records with summary calculations
 * Migrated from old Express timeTracking.controller.ts - EXACT LOGIC
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const timeTrackings = await prisma.timeTracking.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    if (!timeTrackings) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable'
      }, { status: 503 });
    }

    // Calculate totals
    const totalSeconds = timeTrackings.reduce((sum: number, tt: any) => sum + tt.totalSeconds, 0);
    const totalHours = (totalSeconds / 3600).toFixed(2);
    const totalDays = timeTrackings.length;
    const avgHoursPerDay = totalDays > 0 ? (totalSeconds / 3600 / totalDays).toFixed(2) : '0';

    // Format individual records for frontend
    const formattedRecords = timeTrackings.map((tt: any) => ({
      id: tt.id,
      date: tt.date.toISOString(),
      loginTime: tt.loginTime.toISOString(),
      totalSeconds: tt.totalSeconds,
      activeSeconds: tt.activeSeconds || 0,
      idleSeconds: tt.idleSeconds || 0,
      totalHours: (tt.totalSeconds / 3600).toFixed(2),
      activeHours: ((tt.activeSeconds || 0) / 3600).toFixed(2),
      idleHours: ((tt.idleSeconds || 0) / 3600).toFixed(2),
      isActive: tt.isActive,
      isIdle: tt.isIdle,
      productivityScore: tt.totalSeconds > 0 
        ? Math.round(((tt.activeSeconds || 0) / tt.totalSeconds) * 100)
        : 0
    }));

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      summary: {
        totalSeconds,
        totalHours,
        totalDays,
        avgHoursPerDay
      }
    });

  } catch (error) {
    console.error('User time tracking error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch time tracking'
    }, { status: 500 });
  }
}
