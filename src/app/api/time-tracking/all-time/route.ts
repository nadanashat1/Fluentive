import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/middleware/auth';
import { requireAdmin } from '@/lib/server/auth';
import { withTimeout, safeResponse } from '@/lib/server/timeout-guard';

/**
 * Get all users' time tracking (admin only)
 * Migrated from old Express timeTracking.controller.ts - EXACT LOGIC
 */
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    
    // Only admins can view all users' time tracking
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Add pagination to prevent memory overload
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const [timeTrackings, total] = await withTimeout(Promise.all([
      (prisma as any).timeTracking.findMany({
        where,
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { name: true, email: true, role: true }
          }
        },
        take: limit,
        skip
      }),
      (prisma as any).timeTracking.count({ where })
    ]), 20000); // 20 second timeout for this heavy query

    if (!timeTrackings || timeTrackings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No time tracking data found'
      }, { status: 404 });
    }

    // Group by user for summary
    const userSummaries: Record<string, any> = {};
    timeTrackings.forEach((tt: any) => {
      if (!userSummaries[tt.userId]) {
        userSummaries[tt.userId] = {
          userId: tt.userId,
          userName: tt.user.name,
          userEmail: tt.user.email,
          userRole: tt.user.role,
          totalSeconds: 0,
          totalDays: 0,
          activeDays: 0
        };
      }
      userSummaries[tt.userId].totalSeconds += tt.totalSeconds;
      userSummaries[tt.userId].totalDays++;
      if (tt.totalSeconds > 0) userSummaries[tt.userId].activeDays++;
    });

    const summary = Object.values(userSummaries).map((u: any) => ({
      ...u,
      totalHours: (u.totalSeconds / 3600).toFixed(2),
      avgHoursPerDay: u.activeDays > 0 ? (u.totalSeconds / 3600 / u.activeDays).toFixed(2) : '0',
      productivityScore: u.totalSeconds > 0 
        ? Math.round(((timeTrackings
            .filter((tt: any) => tt.userId === u.userId)
            .reduce((sum: number, tt: any) => sum + (tt.activeSeconds || 0), 0)) / u.totalSeconds) * 100)
        : 0
    }));

    return safeResponse({
      success: true,
      data: {
        timeTrackings,
        summary,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('All users time tracking error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch all users time tracking'
    }, { status: 500 });
  }
}
