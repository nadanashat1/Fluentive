// Query Keys Factory - Scalable cache architecture
// Prevents typos, ensures consistency, enables scalable cache management

// Base keys to avoid circular references
const authBase = ['auth'] as const;
const dashboardBase = ['dashboard'] as const;
const leadsBase = ['leads'] as const;
const usersBase = ['users'] as const;
const dealsBase = ['deals'] as const;
const aiBase = ['ai'] as const;
const notificationsBase = ['notifications'] as const;
const timeTrackingBase = ['time-tracking'] as const;
const maintenanceBase = ['maintenance'] as const;
const v2Base = ['v2'] as const;

export const queryKeys = {
  // Authentication
  auth: {
    all: authBase,
    user: () => [...authBase, 'user'] as const,
    login: () => [...authBase, 'login'] as const,
    register: () => [...authBase, 'register'] as const,
    refresh: () => [...authBase, 'refresh'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: dashboardBase,
    summary: () => [...dashboardBase, 'summary'] as const,
    stats: () => [...dashboardBase, 'stats'] as const,
  },
  
  // Leads
  leads: {
    all: leadsBase,
    list: () => [...leadsBase, 'list'] as const,
    detail: (id: string) => [...leadsBase, 'detail', id] as const,
    stats: () => [...leadsBase, 'stats'] as const,
    notes: (id: string) => [...leadsBase, 'notes', id] as const,
    attachments: (id: string) => [...leadsBase, 'attachments', id] as const,
    insights: (id: string) => [...leadsBase, 'insights', id] as const,
    emailSuggestion: (id: string) => [...leadsBase, 'email-suggestion', id] as const,
  },
  
  // Users
  users: {
    all: usersBase,
    list: () => [...usersBase, 'list'] as const,
    detail: (id: string) => [...usersBase, 'detail', id] as const,
  },
  
  // Deals
  deals: {
    all: dealsBase,
    list: () => [...dealsBase, 'list'] as const,
    detail: (id: string) => [...dealsBase, 'detail', id] as const,
  },
  
  // AI
  ai: {
    all: aiBase,
    dashboard: () => [...aiBase, 'dashboard'] as const,
    advanced: {
      all: [...aiBase, 'advanced'] as const,
    },
    prioritizedLeads: () => [...aiBase, 'prioritized-leads'] as const,
  },
  
  // Notifications
  notifications: {
    all: notificationsBase,
    list: () => [...notificationsBase, 'list'] as const,
    detail: (id: string) => [...notificationsBase, 'detail', id] as const,
  },
  
  // Time Tracking
  timeTracking: {
    all: timeTrackingBase,
    myTime: () => [...timeTrackingBase, 'my-time'] as const,
    allTime: () => [...timeTrackingBase, 'all-time'] as const,
    pageViews: () => [...timeTrackingBase, 'page-views'] as const,
    activities: () => [...timeTrackingBase, 'activities'] as const,
    activeUsers: () => [...timeTrackingBase, 'active-users'] as const,
  },
  
  // Activity Logs
  activityLogs: {
    all: ['activity-logs'] as const,
    list: (filters: Record<string, unknown> = {}) =>
      [...['activity-logs'], 'list', filters] as const,
  },
  
  // Health
  health: ['health'] as const,
  
  // Maintenance
  maintenance: {
    all: maintenanceBase,
    myStats: () => [...maintenanceBase, 'my-stats'] as const,
  },
  
  // V2 API
  v2: {
    all: v2Base,
    leads: () => [...v2Base, 'leads'] as const,
  },
} as const;

// Type helpers for better inference
export type QueryKey = typeof queryKeys;
