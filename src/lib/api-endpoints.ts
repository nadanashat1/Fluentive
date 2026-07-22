// ROUTES - Pure constants ONLY - no placeholders, no templates
// Static API surface only - no structure encoding, no runtime interpretation
export const ROUTES = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    refresh: '/api/auth/refresh',
    changePassword: '/api/auth/change-password',
    '2fa': {
      verify: '/api/auth/2fa/verify',
      disable: '/api/auth/2fa/disable'
    }
  },
  dashboard: {
    summary: '/api/dashboard/summary',
    stats: '/api/dashboard/stats'
  },
  analytics: {
    overview: '/api/analytics/overview',
    timeseries: '/api/analytics/timeseries'
  },
  leads: {
    list: '/api/leads',
    create: '/api/leads',
    stats: '/api/leads/stats'
  },
  users: {
    list: '/api/users',
    create: '/api/users'
  },
  deals: {
    list: '/api/deals',
    create: '/api/deals'
  },
  ai: {
    dashboard: '/api/ai/dashboard',
    advanced: {
      overview: '/api/ai/overview'
    },
    prioritizedLeads: '/api/ai/prioritized-leads'
  },
  activityLogs: '/api/activity-logs',
  notifications: {
    list: '/api/notifications',
    markAllRead: '/api/notifications/read-all'
  },
  timeTracking: {
    myTime: '/api/time-tracking/my-time',
    allTime: '/api/time-tracking/all-time',
    summary: '/api/time-tracking/summary',
    heartbeat: '/api/time-tracking/heartbeat',
    endSession: '/api/time-tracking/end-session',
    trackPage: '/api/time-tracking/track-page',
    pageViews: '/api/time-tracking/page-views',
    activities: '/api/time-tracking/activities',
    activeUsers: '/api/time-tracking/active-users'
  },
  health: '/api/health',
  maintenance: {
    myStats: '/api/maintenance/my-stats'
  },
  v2: {
    leads: '/api/v2/leads'
  }
} as const;
