// Business API layer - business logic only with typed validation
// Uses ROUTES for static contracts, ROUTE_FACTORIES for dynamic endpoints
// Production-grade: explicit structure with zero implicit interpretation

import { apiClient } from './apiClient';
import { ROUTES } from './api-endpoints';
import { ROUTE_FACTORIES } from './route-factories';
import { 
  LoginResponseSchema, 
  UserSchema, 
  LeadSchema, 
  LeadListSchema,
  DashboardSummarySchema,
  DealSchema,
  NotificationSchema,
  NotificationListSchema,
  LoginResponse,
  User
} from './schemas';

// Authentication - typed and validated
export const auth = {
  login: (data: { email: string; password: string; rememberMe?: boolean }): Promise<LoginResponse> =>
    apiClient(ROUTES.auth.login, {
      method: 'POST',
      body: JSON.stringify(data),
      schema: LoginResponseSchema
    }),
    
  register: (data: { name: string; email: string; password: string }): Promise<LoginResponse> =>
    apiClient(ROUTES.auth.register, {
      method: 'POST',
      body: JSON.stringify(data),
      schema: LoginResponseSchema
    }),
    
  me: (): Promise<User> =>
    apiClient(ROUTES.auth.me, {
      schema: UserSchema
    }),
    
  logout: () =>
    apiClient(ROUTES.auth.logout),
    
  refresh: () =>
    apiClient(ROUTES.auth.refresh, {
      schema: LoginResponseSchema
    }),
    
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient(ROUTES.auth.changePassword, {
      method: 'POST',
      body: JSON.stringify(data),
      schema: UserSchema
    }),
    
  '2fa': {
    verify: (data: { code: string }) =>
      apiClient(ROUTES.auth['2fa'].verify, {
        method: 'POST',
        body: JSON.stringify(data),
        schema: UserSchema
      }),
    
    disable: () =>
      apiClient(ROUTES.auth['2fa'].disable, {
        method: 'POST',
        schema: UserSchema
      })
  }
};

// Dashboard - typed and validated
export const dashboard = {
  summary: () =>
    apiClient(ROUTES.dashboard.summary, {
      schema: DashboardSummarySchema
    }),
    
  stats: () =>
    apiClient(ROUTES.dashboard.stats, {
      schema: DashboardSummarySchema
    })
};

// Leads - business logic only, use ROUTE_FACTORIES for dynamic routes
export const leads = {
  list: () =>
    apiClient(ROUTES.leads.list),
    
  create: (data: any) =>
    apiClient(ROUTES.leads.create, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  update: (id: string, data: any) =>
    apiClient(ROUTE_FACTORIES.leads.update(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  delete: (id: string) =>
    apiClient(ROUTE_FACTORIES.leads.delete(id), {
      method: 'DELETE'
    }),
    
  get: (id: string) =>
    apiClient(ROUTE_FACTORIES.leads.get(id)),
    
  stats: () =>
    apiClient(ROUTES.leads.stats),
    
  notes: (id: string) =>
    apiClient(ROUTE_FACTORIES.leads.notes(id)),
    
  attachments: (id: string) =>
    apiClient(ROUTE_FACTORIES.leads.attachments(id)),
    
  insights: (id: string) =>
    apiClient(ROUTE_FACTORIES.leads.insights(id)),
    
  emailSuggestion: (id: string) =>
    apiClient(ROUTE_FACTORIES.leads.emailSuggestion(id))
};

// Users - business logic only, use ROUTE_FACTORIES for dynamic routes
export const users = {
  list: () =>
    apiClient(ROUTES.users.list),
    
  create: (data: any) =>
    apiClient(ROUTES.users.create, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  update: (id: string, data: any) =>
    apiClient(ROUTE_FACTORIES.users.update(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  delete: (id: string) =>
    apiClient(ROUTE_FACTORIES.users.delete(id), {
      method: 'DELETE'
    }),
    
  get: (id: string) =>
    apiClient(ROUTE_FACTORIES.users.get(id)),
    
  unlock: (id: string) =>
    apiClient(ROUTE_FACTORIES.users.unlock(id), {
      method: 'POST'
    })
};

// Deals - business logic only, use ROUTE_FACTORIES for dynamic routes
export const deals = {
  list: () =>
    apiClient(ROUTES.deals.list),
    
  create: (data: any) =>
    apiClient(ROUTES.deals.create, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  update: (id: string, data: any) =>
    apiClient(ROUTE_FACTORIES.deals.update(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  delete: (id: string) =>
    apiClient(ROUTE_FACTORIES.deals.delete(id), {
      method: 'DELETE'
    }),
    
  get: (id: string) =>
    apiClient(ROUTE_FACTORIES.deals.get(id))
};

// AI - constants for static routes
export const ai = {
  dashboard: () =>
    apiClient(ROUTES.ai.dashboard),
    
  advanced: {
    revenueForecast: () =>
      apiClient(ROUTES.ai.advanced.revenueForecast),
    
    leadScoring: () =>
      apiClient(ROUTES.ai.advanced.leadScoring),
    
    churnPrediction: () =>
      apiClient(ROUTES.ai.advanced.churnPrediction)
  },
  
  prioritizedLeads: () =>
    apiClient(ROUTES.ai.prioritizedLeads)
};

// Activity Logs - constants for static routes
export const activityLogs = () =>
  apiClient(ROUTES.activityLogs);

// Notifications - business logic only, use ROUTE_FACTORIES for dynamic routes
export const notifications = {
  list: () =>
    apiClient(ROUTES.notifications.list),
    
  markRead: (id: string) =>
    apiClient(ROUTE_FACTORIES.notifications.markRead(id), {
      method: 'POST'
    }),
    
  markAllRead: () =>
    apiClient(ROUTES.notifications.markAllRead, {
      method: 'POST'
    })
};

// Time Tracking - constants for static routes
export const timeTracking = {
  myTime: () =>
    apiClient(ROUTES.timeTracking.myTime),
    
  allTime: () =>
    apiClient(ROUTES.timeTracking.allTime),
    
  summary: (params?: { period?: string }) =>
    apiClient(ROUTES.timeTracking.summary + (params ? `?period=${params.period}` : '')),
    
  heartbeat: (data: { isIdle: boolean }) =>
    apiClient(ROUTES.timeTracking.heartbeat, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  endSession: () =>
    apiClient(ROUTES.timeTracking.endSession, {
      method: 'POST'
    }),
    
  trackPage: (data: any) =>
    apiClient(ROUTES.timeTracking.trackPage, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  pageViews: () =>
    apiClient(ROUTES.timeTracking.pageViews),
    
  activities: () =>
    apiClient(ROUTES.timeTracking.activities),
    
  activeUsers: () =>
    apiClient(ROUTES.timeTracking.activeUsers)
};

// System - constants for static routes
export const health = () =>
  apiClient(ROUTES.health);

export const maintenance = {
  myStats: () =>
    apiClient(ROUTES.maintenance.myStats)
};

// V2 API - constants for static routes
export const v2 = {
  leads: () =>
    apiClient(ROUTES.v2.leads)
};

// Export main API object
export const api = {
  auth,
  dashboard,
  leads,
  users,
  deals,
  ai,
  activityLogs,
  notifications,
  timeTracking,
  health,
  maintenance,
  v2
};

export default api;
