// API Service - Centralized API integration for frontend-backend communication

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  traceId?: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.timeout = 10000; // 10 seconds
    this.retries = 3;
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.retries,
      cache = false
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: { ...this.defaultHeaders, ...headers },
    };

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Add cache control for GET requests
    if (method === 'GET' && !cache) {
      config.headers = {
        ...config.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };
    }

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw {
            status: response.status,
            message: data.error || data.message || `HTTP ${response.status}`,
            code: data.code,
            details: data.details,
          } as ApiError;
        }

        return data as ApiResponse<T>;
      } catch (error) {
        lastError = error as ApiError;
        
        // Don't retry on client errors (4xx)
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  // HTTP Methods
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Dashboard API Methods
  async getRealTimeData() {
    return this.get('/api/dashboard/realtime');
  }

  async getDashboardMetrics() {
    return this.get('/api/dashboard/metrics');
  }

  async getTeamActivity() {
    return this.get('/api/dashboard/team-activity');
  }

  async logActivity(activity: string, type: string) {
    return this.post('/api/dashboard/activity', { activity, type });
  }

  // Presence API Methods
  async getPresenceStatus(userId: string) {
    return this.get(`/api/presence/status/${userId}`);
  }

  async sendHeartbeat(userId: string, status: string) {
    return this.post('/api/presence/heartbeat', { userId, status, timestamp: new Date().toISOString() });
  }

  async logUserActivity(userId: string, activity: any) {
    return this.post('/api/presence/activity', { userId, activity });
  }

  async startPresenceTracking(userId: string) {
    return this.post('/api/presence/start', { userId });
  }

  async stopPresenceTracking(userId: string) {
    return this.post('/api/presence/stop', { userId });
  }

  // Users API Methods
  async getUsers(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    return this.get(`/api/users?${params}`);
  }

  async getUserById(id: string) {
    return this.get(`/api/users/${id}`);
  }

  async createUser(userData: any) {
    return this.post('/api/users', userData);
  }

  async updateUser(id: string, userData: any) {
    return this.put(`/api/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete(`/api/users/${id}`);
  }

  // Leads API Methods
  async getLeads(page = 1, limit = 10, status?: string, search?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return this.get(`/api/leads?${params}`);
  }

  async getLeadById(id: string) {
    return this.get(`/api/leads/${id}`);
  }

  async createLead(leadData: any): Promise<ApiResponse<any>> {
    return this.request('/api/leads', {
      method: 'POST',
      body: leadData,
    });
  }

  async deleteLead(leadId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/leads/${leadId}`, {
      method: 'DELETE',
    });
  }

  async getLeads(): Promise<ApiResponse<any[]>> {
    return this.request('/api/leads', {
      method: 'GET',
    });
  }

  // Deals API Methods
  async getDeals(page = 1, limit = 10, stage?: string, search?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (stage) params.append('stage', stage);
    if (search) params.append('search', search);
    return this.get(`/api/deals?${params}`);
  }

  async getCampaigns(): Promise<ApiResponse<any[]>> {
    return this.request('/api/campaigns', {
      method: 'GET',
    });
  }

  async createCampaign(campaignData: any): Promise<ApiResponse<any>> {
    return this.request('/api/campaigns', {
      method: 'POST',
      body: campaignData,
    });
  }

  async deleteCampaign(campaignId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }

  async getUserSettings(): Promise<ApiResponse<any>> {
    return this.request('/api/user/settings', {
      method: 'GET',
    });
  }

  async updateUserSettings(settingsData: any): Promise<ApiResponse<any>> {
    return this.request('/api/user/settings', {
      method: 'PUT',
      body: settingsData,
    });
  }

  async getAIModels(): Promise<ApiResponse<any[]>> {
    return this.request('/api/ai/models', {
      method: 'GET',
    });
  }

  async trainAIModel(modelId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/ai/models/${modelId}/train`, {
      method: 'POST',
    });
  }

  async deleteAIModel(modelId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/ai/models/${modelId}`, {
      method: 'DELETE',
    });
  }

  async getCourses(): Promise<ApiResponse<any[]>> {
    return this.request('/api/courses', {
      method: 'GET',
    });
  }

  async createCourse(courseData: any): Promise<ApiResponse<any>> {
    return this.request('/api/courses', {
      method: 'POST',
      body: courseData,
    });
  }

  async deleteCourse(courseId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  async getInstructors(): Promise<ApiResponse<any[]>> {
    return this.request('/api/instructors', {
      method: 'GET',
    });
  }

  async createInstructor(instructorData: any): Promise<ApiResponse<any>> {
    return this.request('/api/instructors', {
      method: 'POST',
      body: instructorData,
    });
  }

  async deleteInstructor(instructorId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/instructors/${instructorId}`, {
      method: 'DELETE',
    });
  }

  async getActivityLogs(): Promise<ApiResponse<any[]>> {
    return this.request('/api/activity-logs', {
      method: 'GET',
    });
  }

  async exportActivityLogs(): Promise<ApiResponse<any>> {
    return this.request('/api/activity-logs/export', {
      method: 'POST',
    });
  }

  async getSalesTeam(): Promise<ApiResponse<any[]>> {
    return this.request('/api/sales-team', {
      method: 'GET',
    });
  }

  async createTeamMember(memberData: any): Promise<ApiResponse<any>> {
    return this.request('/api/sales-team', {
      method: 'POST',
      body: memberData,
    });
  }

  async deleteTeamMember(memberId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/sales-team/${memberId}`, {
      method: 'DELETE',
    });
  }

  async getDeals(): Promise<ApiResponse<any[]>> {
    return this.request('/api/deals', {
      method: 'GET',
    });
  }

  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/api/users', {
      method: 'GET',
    });
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.request('/api/system/health', {
      method: 'GET',
    });
  }

  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.request('/api/notifications', {
      method: 'GET',
    });
  }

  async getDealById(id: string) {
    return this.get(`/api/deals/${id}`);
  }

  async createDeal(dealData: any) {
    return this.post('/api/deals', dealData);
  }

  async updateDeal(id: string, dealData: any) {
    return this.put(`/api/deals/${id}`, dealData);
  }

  async deleteDeal(id: string) {
    return this.delete(`/api/deals/${id}`);
  }

  // Activities API Methods
  async getActivities(page = 1, limit = 10, type?: string, userId?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (type) params.append('type', type);
    if (userId) params.append('userId', userId);
    return this.get(`/api/activities?${params}`);
  }

  async getActivityById(id: string) {
    return this.get(`/api/activities/${id}`);
  }

  async createActivity(activityData: any) {
    return this.post('/api/activities', activityData);
  }

  // Notifications API Methods
  async getNotifications(page = 1, limit = 10, unreadOnly = false) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (unreadOnly) params.append('unreadOnly', 'true');
    return this.get(`/api/notifications?${params}`);
  }

  async markNotificationAsRead(id: string) {
    return this.patch(`/api/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.patch('/api/notifications/read-all');
  }

  async deleteNotification(id: string) {
    return this.delete(`/api/notifications/${id}`);
  }

  // Time Tracking API Methods
  async getTimeTrackingStatus(userId: string) {
    return this.get(`/api/time-tracking/status/${userId}`);
  }

  async startTimeTracking(userId: string) {
    return this.post('/api/time-tracking/start', { userId });
  }

  async stopTimeTracking(userId: string) {
    return this.post('/api/time-tracking/stop', { userId });
  }

  async logTimeEntry(userId: string, entryData: any) {
    return this.post('/api/time-tracking/log', { userId, ...entryData });
  }

  async getTimeEntries(userId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.get(`/api/time-tracking/entries/${userId}?${params}`);
  }

  // AI API Methods
  async getAiInsights(type: string, data?: any) {
    return this.post('/api/ai/insights', { type, data });
  }

  async getAiRecommendations(context: string) {
    return this.get(`/api/ai/recommendations?context=${encodeURIComponent(context)}`);
  }

  async generateAiReport(reportType: string, parameters: any) {
    return this.post('/api/ai/generate-report', { reportType, parameters });
  }

  // System Health API Methods
  async getSystemHealth() {
    return this.get('/api/observability');
  }

  async getCacheStats() {
    return this.get('/api/cache/stats');
  }

  async getErrorStats() {
    return this.get('/api/errors/stats');
  }

  // File Upload API Methods
  async uploadFile(file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Batch Operations
  async batchCreate<T>(endpoint: string, items: any[]): Promise<ApiResponse<T[]>> {
    return this.post(`${endpoint}/batch`, { items });
  }

  async batchUpdate<T>(endpoint: string, updates: { id: string; data: any }[]): Promise<ApiResponse<T[]>> {
    return this.patch(`${endpoint}/batch`, { updates });
  }

  async batchDelete(endpoint: string, ids: string[]): Promise<ApiResponse<void>> {
    return this.delete(`${endpoint}/batch`, { body: { ids } });
  }

  // WebSocket connection helper
  createWebSocket(endpoint: string, protocols?: string[]): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws') + endpoint;
    return new WebSocket(wsUrl, protocols);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/api/health', { timeout: 5000, retries: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export types - ApiError is already exported above
