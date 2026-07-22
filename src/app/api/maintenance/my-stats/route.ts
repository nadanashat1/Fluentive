import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    
    // Get user's time tracking stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTracking = await prisma.timeTracking.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      }
    });
    
    // Calculate total minutes from loginTime and lastActivity
    const todayMinutes = todayTracking ? 
      Math.floor((new Date(todayTracking.lastActivity || new Date()).getTime() - new Date(todayTracking.loginTime).getTime()) / 60000) : 0;
    
    // Get weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyTracking = await prisma.timeTracking.findMany({
      where: {
        userId: user.id,
        date: {
          gte: weekAgo
        }
      }
    });
    
    const totalWeeklyMinutes = weeklyTracking.reduce((sum: number, t: any) => {
      const minutes = Math.floor((new Date(t.lastActivity || new Date()).getTime() - new Date(t.loginTime).getTime()) / 60000);
      return sum + minutes;
    }, 0);
    
    return NextResponse.json({
      success: true,
      data: {
        today: {
          date: today,
          totalMinutes: todayMinutes,
          sessions: todayTracking ? 1 : 0
        },
        week: {
          totalMinutes: totalWeeklyMinutes,
          averageMinutes: Math.round(totalWeeklyMinutes / 7),
          daysTracked: weeklyTracking.length
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch stats'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
