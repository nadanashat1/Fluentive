import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/middleware/auth';

/**
 * Manual logout — ends active time tracking for today.
 * Session duration updates use legacy `session` delegate (not on Prisma schema).
 */
export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      );
    }

    const userId = user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeTracking = await prisma.timeTracking.updateMany({
      where: {
        userId,
        date: today,
        isActive: true
      },
      data: {
        isActive: false,
        lastActivity: new Date(),
        lastHeartbeat: new Date()
      }
    });

    const db = prisma as any;
    const sessions = await db.session.findMany({
      where: { userId, isRevoked: false }
    });

    if (sessions?.length) {
      for (const session of sessions) {
        const duration = Math.floor(
          (new Date().getTime() - new Date(session.loginAt).getTime()) / 1000
        );
        await db.session.update({
          where: { id: session.id },
          data: {
            logoutAt: new Date(),
            duration
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully',
      data: {
        sessionsUpdated: sessions?.length || 0,
        timeTrackingUpdated: timeTracking.count
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end session'
      },
      { status: 500 }
    );
  }
}
