import { prisma } from '@/lib/prisma';
import { TimelineItem } from '@/types/timeline';

// Use type assertions to bypass TypeScript errors temporarily
const prismaClient = prisma as any;

/**
 * Heartbeat endpoint - Called every minute from frontend
 * Updates last activity timestamp and calculates work time
 * Includes idle detection
 * Migrated from old Express timeTracking.controller.ts
 */
export const heartbeat = async (userId: string, isIdle: boolean = false, ip?: string, userAgent?: string) => {
  // Get today's date (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find or create today's time tracking record
  const timeTracking = await prismaClient.timeTracking.upsert({
    where: {
      userId_date: {
        userId,
        date: today
      }
    },
    create: {
      userId,
      date: today,
      loginTime: new Date(),
      totalSeconds: 0,
      activeSeconds: 0,
      idleSeconds: 0,
      isActive: true,
      isIdle: isIdle || false,
      lastHeartbeat: new Date(),
      lastActivity: new Date(),
      ip,
      userAgent
    },
    update: {
      lastHeartbeat: new Date(),
      lastActivity: new Date(),
      isIdle: isIdle || false,
      isActive: true
    }
  });

  if (!timeTracking) {
    throw new Error('Database unavailable');
  }

  // Calculate time since last heartbeat (60 seconds typically)
  const timeSinceLastHeartbeat = Math.floor((new Date().getTime() - timeTracking.lastHeartbeat.getTime()) / 1000);
  
  // Calculate total time since login
  const totalSeconds = Math.floor((new Date().getTime() - timeTracking.loginTime.getTime()) / 1000);

  // Update active/idle seconds based on current state
  const updateData: any = {
    totalSeconds
  };

  if (isIdle) {
    // User is idle - add to idle seconds
    updateData.idleSeconds = (timeTracking.idleSeconds || 0) + timeSinceLastHeartbeat;
  }
  else {
    // User is active - add to active seconds
    updateData.activeSeconds = (timeTracking.activeSeconds || 0) + timeSinceLastHeartbeat;
  }

  await prismaClient.timeTracking.update({
    where: { id: timeTracking.id },
    data: updateData
  });

  // Update session last activity
  await prismaClient.session.updateMany({
    where: { userId, isRevoked: false },
    data: { lastActivity: new Date() }
  });

  // Calculate productivity score (active / total)
  const productivityScore = totalSeconds > 0
    ? Math.round(((timeTracking.activeSeconds || 0) / totalSeconds) * 100)
    : 0;

  return {
    totalSeconds,
    totalHours: (totalSeconds / 3600).toFixed(2),
    activeSeconds: timeTracking.activeSeconds || 0,
    idleSeconds: timeTracking.idleSeconds || 0,
    activeHours: ((timeTracking.activeSeconds || 0) / 3600).toFixed(2),
    idleHours: ((timeTracking.idleSeconds || 0) / 3600).toFixed(2),
    isIdle: isIdle || false,
    productivityScore,
    isActive: true
  };
};

export const getUserTimeTracking = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeTracking = await prismaClient.timeTracking.findUnique({
    where: {
      userId_date: {
        userId,
        date: today
      }
    }
  });

  if (!timeTracking) {
    return {
      totalHours: "0h",
      activeHours: "0h", 
      isActive: false
    };
  }

  return {
    totalHours: `${(timeTracking.totalSeconds / 3600).toFixed(1)}h`,
    activeHours: `${(timeTracking.activeSeconds / 3600).toFixed(1)}h`,
    isActive: timeTracking.isActive && !timeTracking.isIdle
  };
};

export const getActiveUsers = async () => {
  // Users with heartbeat in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activeUsers = await prismaClient.timeTracking.findMany({
    where: {
      isActive: true,
      lastHeartbeat: { gte: fiveMinutesAgo }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: { lastHeartbeat: 'desc' }
  });

  return activeUsers.map((t: any) => ({
    id: t.userId,
    name: t.user.name,
    email: t.user.email,
    role: t.user.role,
    lastActivity: t.lastActivity,
    lastHeartbeat: t.lastHeartbeat,
    isActive: t.isActive,
    isIdle: t.isIdle
  }));
};

export const getUserActivities = async (userId: string, limit: number = 20) => {
  // Fetch recent activities from ActivityLog table
  const activities = await prismaClient.activityLog.findMany({
    where: { userId },
    include: {
      lead: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  // Also fetch session login/logout events
  const sessions = await prismaClient.session.findMany({
    where: { userId },
    orderBy: { loginAt: 'desc' },
    take: 10
  });

  // Combine and format activities
  const timeline: TimelineItem[] = [];

  // Add session events
  sessions?.forEach((session: any) => {
    timeline.push({
      id: `session-${session.id}`,
      type: 'login',
      title: 'Logged in',
      description: `Session started from ${session.device || 'Unknown Device'}`,
      timestamp: session.loginAt.toISOString(),
      icon: 'LogIn',
      category: 'system'
    });
    if (session.logoutAt) {
      timeline.push({
        id: `session-logout-${session.id}`,
        type: 'logout',
        title: 'Logged out',
        description: `Session ended - Duration: ${Math.floor((session.duration || 0) / 60)} minutes`,
        timestamp: session.logoutAt.toISOString(),
        icon: 'LogOut',
        category: 'system'
      });
    }
  });

  // Add activity log events
  activities?.forEach((activity: any) => {
    const actionType = getActivityType(activity.action);
    timeline.push({
      id: activity.id,
      type: actionType.type,
      title: actionType.title,
      description: activity.lead ? `Lead: ${activity.lead.name}` : activity.details || undefined,
      timestamp: activity.createdAt.toISOString(),
      icon: actionType.icon,
      category: 'activity'
    });
  });

  // Sort by timestamp descending
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Take only the requested limit
  return timeline.slice(0, limit);
};

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

function getActivityIcon(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create')) return 'Plus';
  if (actionLower.includes('update') || actionLower.includes('edit')) return 'Edit';
  if (actionLower.includes('delete')) return 'Trash';
  if (actionLower.includes('login')) return 'LogIn';
  if (actionLower.includes('logout')) return 'LogOut';
  if (actionLower.includes('view')) return 'Eye';
  return 'Activity';
}
