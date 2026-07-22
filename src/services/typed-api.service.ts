// Type-safe API service layer
// Uses unified API client with DTO validation
// Eliminates all 'any' types from API calls

import { api, safeApi } from '@/lib/unified-api-client';
import { 
  Schemas,
  type BaseResponse,
  type UserDto,
  type LeadDto,
  type DealDto,
  type DashboardSummary,
  type DashboardStats,
  type ActivityDto,
  type NotificationDto,
  type LoginRequest,
  type RegisterRequest,
  type CreateLeadRequest,
  type UpdateLeadRequest,
  type CreateDealRequest,
  type LeadFilters,
  type DealFilters,
  type ActivityFilters,
  type PaginationParams,
  type AuthResponse,
  type LeadListResponse,
  type DealListResponse,
  type DealResponse,
  type DashboardSummaryResponse,
  type DashboardStatsResponse,
  type NotificationListResponse,
  type UserResponse,
  type LeadResponse
} from '@/types/dto';

// Time tracking data interface (matching API response)
interface TimeTrackingData {
  id: string;
  date: string;
  loginTime: string;
  totalSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
  totalHours: string;
  activeHours: string;
  idleHours: string;
  isActive: boolean;
  isIdle: boolean;
  productivityScore: number;
}

// Authentication service with full type safety
export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post('/auth/login', data, Schemas.AuthResponse),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post('/auth/register', data, Schemas.AuthResponse),

  logout: (): Promise<BaseResponse> =>
    api.post('/auth/logout', {}, Schemas.BaseResponse),

  me: (): Promise<UserResponse> =>
    api.get('/auth/me', Schemas.UserResponse),

  refresh: (): Promise<AuthResponse> =>
    api.post('/auth/refresh', {}, Schemas.AuthResponse),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<UserResponse> =>
    api.post('/auth/change-password', data, Schemas.UserResponse)
};

// Leads service with full type safety
export const leadsApi = {
  list: (filters: LeadFilters): Promise<LeadListResponse> =>
    api.get(`/leads?page=${filters.page}&limit=${filters.limit}${filters.search ? `&search=${filters.search}` : ''}${filters.status ? `&status=${filters.status}` : ''}`, Schemas.LeadListResponse),

  get: (id: string): Promise<LeadResponse> =>
    api.get(`/leads/${id}`, Schemas.LeadResponse),

  create: (data: CreateLeadRequest): Promise<LeadResponse> =>
    api.post('/leads', data, Schemas.LeadResponse),

  update: (id: string, data: UpdateLeadRequest): Promise<LeadResponse> =>
    api.put(`/leads/${id}`, data, Schemas.LeadResponse),

  delete: (id: string): Promise<BaseResponse> =>
    api.delete(`/leads/${id}`, Schemas.BaseResponse),

  stats: (): Promise<BaseResponse<{ total: number; byStatus: Record<string, number> }>> =>
    api.get('/leads/stats', Schemas.BaseResponse),

  notes: (id: string): Promise<BaseResponse<ActivityDto[]>> =>
    api.get(`/leads/${id}/notes`, Schemas.BaseResponse),

  attachments: (id: string): Promise<BaseResponse<string[]>> =>
    api.get(`/leads/${id}/attachments`, Schemas.BaseResponse),

  insights: (id: string): Promise<BaseResponse<{ score: number; suggestions: string[] }>> =>
    api.get(`/leads/${id}/insights`, Schemas.BaseResponse),

  emailSuggestion: (id: string): Promise<BaseResponse<{ subject: string; body: string }>> =>
    api.get(`/leads/${id}/email-suggestion`, Schemas.BaseResponse)
};

// Deals service with full type safety
export const dealsApi = {
  list: (filters: DealFilters): Promise<DealListResponse> =>
    api.get(`/deals?page=${filters.page}&limit=${filters.limit}${filters.search ? `&search=${filters.search}` : ''}${filters.stage ? `&stage=${filters.stage}` : ''}${filters.leadId ? `&leadId=${filters.leadId}` : ''}`, Schemas.DealListResponse),

  get: (id: string): Promise<DealResponse> =>
    api.get(`/deals/${id}`, Schemas.DealResponse),

  create: (data: CreateDealRequest): Promise<DealResponse> =>
    api.post('/deals', data, Schemas.DealResponse),

  update: (id: string, data: Partial<CreateDealRequest>): Promise<DealResponse> =>
    api.put(`/deals/${id}`, data, Schemas.DealResponse),

  delete: (id: string): Promise<BaseResponse> =>
    api.delete(`/deals/${id}`, Schemas.BaseResponse)
};

// Dashboard service with full type safety
export const dashboardApi = {
  summary: (): Promise<DashboardSummaryResponse> =>
    api.get('/dashboard/summary', Schemas.DashboardSummaryResponse),

  stats: (): Promise<DashboardStatsResponse> =>
    api.get('/dashboard/stats', Schemas.DashboardStatsResponse)
};

// Activities service with full type safety
export const activitiesApi = {
  list: (filters: ActivityFilters): Promise<BaseResponse<ActivityDto[]>> =>
    api.get(`/activities?page=${filters.page}&limit=${filters.limit}${filters.type ? `&type=${filters.type}` : ''}${filters.leadId ? `&leadId=${filters.leadId}` : ''}${filters.dealId ? `&dealId=${filters.dealId}` : ''}`, Schemas.BaseResponse),

  get: (id: string): Promise<BaseResponse<ActivityDto>> =>
    api.get(`/activities/${id}`, Schemas.BaseResponse),

  create: (data: { type: string; subject: string; description?: string; leadId?: string; dealId?: string }): Promise<BaseResponse<ActivityDto>> =>
    api.post('/activities', data, Schemas.BaseResponse),

  update: (id: string, data: Partial<{ type: string; subject: string; description: string }>): Promise<BaseResponse<ActivityDto>> =>
    api.put(`/activities/${id}`, data, Schemas.BaseResponse),

  delete: (id: string): Promise<BaseResponse> =>
    api.delete(`/activities/${id}`, Schemas.BaseResponse)
};

// Notifications service with full type safety
export const notificationsApi = {
  list: (params: PaginationParams): Promise<NotificationListResponse> =>
    api.get(`/notifications?page=${params.page}&limit=${params.limit}`, Schemas.NotificationListResponse),

  markRead: (id: string): Promise<BaseResponse> =>
    api.post(`/notifications/${id}/mark-read`, {}, Schemas.BaseResponse),

  markAllRead: (): Promise<BaseResponse> =>
    api.post('/notifications/mark-all-read', {}, Schemas.BaseResponse)
};

// Users service with full type safety
export const usersApi = {
  list: (params: PaginationParams): Promise<BaseResponse<UserDto[]>> =>
    api.get(`/users?page=${params.page}&limit=${params.limit}`, Schemas.BaseResponse),

  get: (id: string): Promise<UserResponse> =>
    api.get(`/users/${id}`, Schemas.UserResponse),

  create: (data: { name: string; email: string; password: string; role: string }): Promise<UserResponse> =>
    api.post('/users', data, Schemas.UserResponse),

  update: (id: string, data: Partial<{ name: string; email: string; role: string }>): Promise<UserResponse> =>
    api.put(`/users/${id}`, data, Schemas.UserResponse),

  delete: (id: string): Promise<BaseResponse> =>
    api.delete(`/users/${id}`, Schemas.BaseResponse),

  unlock: (id: string): Promise<BaseResponse> =>
    api.post(`/users/${id}/unlock`, {}, Schemas.BaseResponse)
};

// Time tracking service with full type safety
export const timeTrackingApi = {
  myTime: (): Promise<BaseResponse<TimeTrackingData[]>> =>
    api.get('/time-tracking/my-time', Schemas.BaseResponse),

  allTime: (): Promise<BaseResponse<{ users: Array<{ userId: string; totalSeconds: number }> }>> =>
    api.get('/time-tracking/all-time', Schemas.BaseResponse),

  heartbeat: (data: { isIdle: boolean }): Promise<BaseResponse> =>
    api.post('/time-tracking/heartbeat', data, Schemas.BaseResponse),

  endSession: (): Promise<BaseResponse> =>
    api.post('/time-tracking/end-session', {}, Schemas.BaseResponse),

  trackPage: (data: { page: string; duration?: number }): Promise<BaseResponse> =>
    api.post('/time-tracking/track-page', data, Schemas.BaseResponse),

  pageViews: (): Promise<BaseResponse<Array<{ page: string; views: number; avgDuration: number }>>> =>
    api.get('/time-tracking/page-views', Schemas.BaseResponse),

  activities: (): Promise<BaseResponse<Array<{ activity: string; timestamp: string; duration: number }>>> =>
    api.get('/time-tracking/activities', Schemas.BaseResponse),

  activeUsers: (): Promise<BaseResponse<Array<{ userId: string; lastActivity: string; isActive: boolean }>>> =>
    api.get('/time-tracking/active-users', Schemas.BaseResponse)
};

// AI service with full type safety
export const aiApi = {
  dashboard: (): Promise<BaseResponse<{ insights: string[]; recommendations: string[] }>> =>
    api.get('/ai/dashboard', Schemas.BaseResponse),

  revenueForecast: (): Promise<BaseResponse<{ forecast: Array<{ month: string; revenue: number }> }>> =>
    api.get('/ai/advanced/revenue-forecast', Schemas.BaseResponse),

  leadScoring: (): Promise<BaseResponse<{ leads: Array<{ leadId: string; score: number; factors: string[] }> }>> =>
    api.get('/ai/advanced/lead-scoring', Schemas.BaseResponse),

  churnPrediction: (): Promise<BaseResponse<{ predictions: Array<{ userId: string; risk: number; factors: string[] }> }>> =>
    api.get('/ai/advanced/churn-prediction', Schemas.BaseResponse),

  prioritizedLeads: (): Promise<BaseResponse<{ leads: Array<{ leadId: string; priority: number; reasons: string[] }> }>> =>
    api.get('/ai/prioritized-leads', Schemas.BaseResponse)
};

// Health check service
export const healthApi = {
  check: (): Promise<BaseResponse<{ status: string; timestamp: string; services: Record<string, string> }>> =>
    api.get('/health', Schemas.BaseResponse)
};

// Safe versions of all APIs (return null on error)
export const safeAuthApi = {
  login: (data: LoginRequest): Promise<AuthResponse | null> =>
    safeApi.post('/auth/login', data, Schemas.Auth),

  register: (data: RegisterRequest): Promise<AuthResponse | null> =>
    safeApi.post('/auth/register', data, Schemas.Auth),

  logout: (): Promise<BaseResponse | null> =>
    safeApi.post('/auth/logout', {}, Schemas.BaseResponse),

  me: (): Promise<UserResponse | null> =>
    safeApi.get('/auth/me', Schemas.UserResponse)
};

export const safeLeadsApi = {
  list: (filters: LeadFilters): Promise<LeadListResponse | null> =>
    safeApi.get(`/leads?page=${filters.page}&limit=${filters.limit}${filters.search ? `&search=${filters.search}` : ''}${filters.status ? `&status=${filters.status}` : ''}`, Schemas.LeadListResponse),

  get: (id: string): Promise<LeadResponse | null> =>
    safeApi.get(`/leads/${id}`, Schemas.LeadResponse)
};

export const safeDashboardApi = {
  summary: (): Promise<DashboardSummaryResponse | null> =>
    safeApi.get('/dashboard/summary', Schemas.DashboardSummaryResponse),

  stats: (): Promise<DashboardStatsResponse | null> =>
    safeApi.get('/dashboard/stats', Schemas.DashboardStatsResponse)
};

// Export main API object
export const typedApi = {
  auth: authApi,
  leads: leadsApi,
  deals: dealsApi,
  dashboard: dashboardApi,
  activities: activitiesApi,
  notifications: notificationsApi,
  users: usersApi,
  timeTracking: timeTrackingApi,
  ai: aiApi,
  health: healthApi,
  safe: {
    auth: safeAuthApi,
    leads: safeLeadsApi,
    dashboard: safeDashboardApi
  }
};

export default typedApi;
