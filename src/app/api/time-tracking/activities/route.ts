import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/auth';
import { TimelineItem } from '@/types/timeline';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse, validateResponseSize } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';

/**
 * Helper function to determine activity type from action string
 * Migrated from old Express controller
 */
function getActivityType(action: string): { type: string; title: string; icon: string } {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('add')) {
    return { type: 'create', title: 'Created Record', icon: 'FileText' };
  }
  if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('modify')) {
    return { type: 'update', title: 'Updated Record', icon: 'Settings' };
  }
  if (actionLower.includes('delete') || actionLower.includes('remove')) {
    return { type: 'delete', title: 'Deleted Record', icon: 'Trash2' };
  }
  if (actionLower.includes('view') || actionLower.includes('get') || actionLower.includes('read')) {
    return { type: 'view', title: 'Viewed Record', icon: 'Eye' };
  }
  if (actionLower.includes('login') || actionLower.includes('auth')) {
    return { type: 'login', title: 'Authentication', icon: 'LogIn' };
  }
  return { type: 'other', title: action, icon: 'Clock' };
}

/**
 * Get user activity timeline
 * Returns recent activities for the authenticated user
 * Merges ActivityLog + Session events into unified timeline
 * Migrated from old Express timeTracking.controller.ts - EXACT LOGIC
 */
export const GET = withMemoryCheck(async (req: NextRequest | Request) => {
  try {
    const { user, error } = await requireAuth(req as NextRequest);
    if (error || !user) {
      return createCompressedResponse({
        success: false,
        error: 'User not authenticated'
      }, 401);
    }

    const userId = user.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch recent activities - lightweight query only
    const activities = await withTimeout((prisma as any).activity.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        createdAt: true,
        leadId: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }), 5000);

    // Also fetch session login/logout events
    const sessions = await withTimeout((prisma as any).userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    }), 10000);

    // Combine and format activities
    const timeline: TimelineItem[] = [];

    // Add session events with normalized timestamps
    if (sessions && Array.isArray(sessions)) {
      sessions.forEach((session: any) => {
        const loginTimestamp = session.createdAt.toISOString();
        timeline.push({
          id: `session-${session.id}`,
          type: 'login',
          title: 'Logged in',
          description: `Session started from ${session.deviceInfo?.toString() || 'Unknown Device'}`,
          timestamp: loginTimestamp,
          timestampType: 'loginAt',
          icon: 'LogIn',
          category: 'system'
        });
      });
    }

    // Add activity log events with normalized timestamps
    if (activities && Array.isArray(activities)) {
      activities.forEach((activity: any) => {
        const actionType = getActivityType(activity.type);
        const activityTimestamp = activity.createdAt.toISOString();
        timeline.push({
          id: activity.id,
          type: actionType.type,
          title: actionType.title,
          description: activity.lead ? `Lead: ${activity.lead.name}` : activity.description || undefined,
          timestamp: activityTimestamp,
          timestampType: 'createdAt',
          icon: actionType.icon,
          category: 'activity'
        });
      });
    }

    // Sort by timestamp descending with proper date comparison
    timeline.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    // Take only the requested limit
    const limitedTimeline = timeline.slice(0, limit);

    const responseData = {
      success: true,
      data: limitedTimeline,
      count: limitedTimeline.length
    };
    
    const sizeCheck = validateResponseSize(responseData);
    return createCompressedResponse(responseData, 200, {
      'X-Response-Size': `${sizeCheck.sizeKB}KB`,
      ...(sizeCheck.warning && { 'X-Size-Warning': sizeCheck.warning })
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('User activities error:', error);
    }
    return createCompressedResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch activities'
    }, 500);
  }
});
