import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/auth';

/**
 * Get currently active users
 * Logic: Users with heartbeat in last 5 minutes = ONLINE
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
    
    // CRITICAL FIX: Multiple time windows for accurate online status
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // Limit results to prevent memory overload
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Get active users from time tracking (primary source - 5 min window)
    const activeUsers = await (prisma as any).timeTracking.findMany({
      where: {
        isActive: true,
        lastHeartbeat: { gte: fiveMinutesAgo }
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { lastHeartbeat: 'desc' },
      take: limit
    });

    // Also check for users with recent session activity (10 min window for tab close scenarios)
    const recentSessions = await (prisma as any).userSession.findMany({
      where: {
        isActive: true,
        updatedAt: { gte: tenMinutesAgo }
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      take: limit
    });

    // Merge and deduplicate users
    const userMap = new Map();
    
    // Add time tracking users (primary - 5 min window = definitely online)
    activeUsers.forEach((t: any) => {
      userMap.set(t.userId, {
        id: t.userId,
        name: t.user.name,
        email: t.user.email,
        role: t.user.role,
        lastActivity: t.lastActivity,
        lastHeartbeat: t.lastHeartbeat,
        isActive: t.isActive,
        isIdle: t.isIdle,
        isOnline: true,
        source: 'heartbeat',
        onlineStatus: 'active' // Recently active
      });
    });

    // Add session users (fallback - 10 min window = possibly online)
    recentSessions.forEach((session: any) => {
      const existing = userMap.get(session.userId);
      if (!existing) {
        const isRecentSession = session.updatedAt >= fiveMinutesAgo;
        userMap.set(session.userId, {
          id: session.userId,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          lastActivity: session.updatedAt,
          lastHeartbeat: session.updatedAt,
          isActive: session.isActive,
          isIdle: false,
          isOnline: isRecentSession,
          source: 'session',
          onlineStatus: isRecentSession ? 'active' : 'away'
        });
      } else if (existing.source === 'session') {
        const isRecentSession = session.updatedAt >= fiveMinutesAgo;
        existing.isOnline = isRecentSession;
        existing.onlineStatus = isRecentSession ? 'active' : 'away';
      }
    });

    // Convert Map to array and sort by last activity
    const formattedUsers = Array.from(userMap.values()).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      count: formattedUsers.length,
      onlineCount: formattedUsers.filter(u => u.isOnline).length
    });

  } catch (error) {
    console.error('Active users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active users'
    }, { status: 500 });
  }
}
