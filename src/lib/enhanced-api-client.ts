// Enhanced API Client with Authentication for Fluentive CRM

import type { UserRole } from '@prisma/client';
import { Roles, RoleType } from '@/constants/roles';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  organization?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST';
  userId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  deals?: Deal[];
  activities?: Activity[];
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: 'OPEN' | 'WON' | 'LOST';
  userId: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  lead?: Lead;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description?: string;
  userId?: string;
  leadId?: string;
  dealId?: string;
  createdAt: string;
  user?: User;
  lead?: Lead;
  deal?: Deal;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardSummary {
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
    byStatus: Array<{ status: string; count: number }>;
    daily: Array<{ date: string; count: number }>;
  };
  deals: {
    total: number;
    won: number;
    totalValue: number;
    byStage: Array<{ stage: string; count: number }>;
  };
  engagement: {
    recent: Array<{
      id: string;
      type: string;
      description?: string;
      timestamp: string;
      user?: { id: string; name: string };
      lead?: { id: string; name: string };
    }>;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeTrackingEntry {
  id: string;
  userId: string;
  date: string;
  loginTime: string;
  totalSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
  isActive: boolean;
  isIdle: boolean;
  lastHeartbeat: string;
  lastActivity: string;
  ip?: string;
  userAgent?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
    
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('fluentive_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fluentive_token', response.data.token);
      }
    }

    return response;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fluentive_token', response.data.token);
      }
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fluentive_token');
    }
  }

  // User methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<ApiResponse<User[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<User[]>(`/users?${queryParams}`);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Lead methods
  async getLeads(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Lead[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<Lead[]>(`/leads?${queryParams}`);
  }

  async getLead(id: string): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`);
  }

  async createLead(leadData: {
    name: string;
    email: string;
    phone: string;
    userId: string;
  }): Promise<ApiResponse<Lead>> {
    return this.request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id: string, leadData: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  async deleteLead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Deal methods
  async getDeals(params?: {
    page?: number;
    limit?: number;
    stage?: string;
    userId?: string;
  }): Promise<ApiResponse<Deal[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<Deal[]>(`/deals?${queryParams}`);
  }

  async getDeal(id: string): Promise<ApiResponse<Deal>> {
    return this.request<Deal>(`/deals/${id}`);
  }

  async createDeal(dealData: {
    title: string;
    value?: number;
    stage?: string;
    userId: string;
    leadId: string;
  }): Promise<ApiResponse<Deal>> {
    return this.request<Deal>('/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    });
  }

  async updateDeal(id: string, dealData: Partial<Deal>): Promise<ApiResponse<Deal>> {
    return this.request<Deal>(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dealData),
    });
  }

  async deleteDeal(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/deals/${id}`, {
      method: 'DELETE',
    });
  }

  // Activity methods
  async getActivities(params?: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
    leadId?: string;
    dealId?: string;
  }): Promise<ApiResponse<Activity[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<Activity[]>(`/activities?${queryParams}`);
  }

  async getActivity(id: string): Promise<ApiResponse<Activity>> {
    return this.request<Activity>(`/activities/${id}`);
  }

  async createActivity(activityData: {
    type: string;
    description?: string;
    userId?: string;
    leadId?: string;
    dealId?: string;
  }): Promise<ApiResponse<Activity>> {
    return this.request<Activity>('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async updateActivity(id: string, activityData: Partial<Activity>): Promise<ApiResponse<Activity>> {
    return this.request<Activity>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    });
  }

  async deleteActivity(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard methods
  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    return this.request<DashboardSummary>('/dashboard/summary');
  }

  async getRevenueAnalytics(params?: {
    period?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<any>(`/dashboard/revenue?${queryParams}`);
  }

  // AI methods
  async getAiDashboard(): Promise<ApiResponse<any>> {
    return this.request<any>('/ai/dashboard');
  }

  async getRevenueForecast(): Promise<ApiResponse<any>> {
    return this.request<any>('/ai/advanced/revenue-forecast');
  }

  async scoreLead(leadId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/ai/score-lead', {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    });
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<ApiResponse<Notification[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<Notification[]>(`/notifications?${queryParams}`);
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
    return this.request<Notification>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return this.request<void>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async createNotification(notificationData: {
    title: string;
    message: string;
    type?: string;
    userId: string;
  }): Promise<ApiResponse<Notification>> {
    return this.request<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Time tracking methods
  async getTimeTracking(params?: {
    date?: string;
  }): Promise<ApiResponse<TimeTrackingEntry[]>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<TimeTrackingEntry[]>(`/time-tracking?${queryParams}`);
  }

  async startTimeTracking(data?: {
    ip?: string;
    userAgent?: string;
  }): Promise<ApiResponse<TimeTrackingEntry>> {
    return this.request<TimeTrackingEntry>('/time-tracking/start', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async updateHeartbeat(): Promise<ApiResponse<TimeTrackingEntry>> {
    return this.request<TimeTrackingEntry>('/time-tracking/heartbeat', {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  async stopTimeTracking(): Promise<ApiResponse<TimeTrackingEntry>> {
    return this.request<TimeTrackingEntry>('/time-tracking/stop', {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  async getTimeTrackingSummary(params?: {
    period?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/api/time-tracking/summary?${queryParams}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; database: string }>> {
    return this.request<{ status: string; timestamp: string; database: string }>('/health');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// Type definitions only - interfaces are exported above

// Type definitions to avoid export conflicts - ApiResponse interface removed

// Type definitions moved to types/index.ts to avoid export conflicts
