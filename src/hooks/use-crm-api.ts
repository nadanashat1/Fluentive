import { useState, useEffect, useCallback, useRef } from 'react';
import { getErrorMessage } from '@/lib/utils/error';
import { apiClient, type User } from '../lib/enhanced-api-client';

// Generic API hook
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiRef = useRef(apiCall);
  apiRef.current = apiCall;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRef.current();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Authentication hooks
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('fluentive_token');
      if (token) {
        try {
          setLoading(true);
          const response = await apiClient.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('fluentive_token');
        } finally {
          setLoading(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      setLoading(false);
      return { success: false, message: getErrorMessage(error, 'Login failed') };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      setLoading(false);
      return { success: false, message: getErrorMessage(error, 'Registration failed') };
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('fluentive_token');
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout
  };
}

// Leads hooks
export function useLeads(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useApi(() => apiClient.getLeads(params), [params]);
}

export function useLead(id: string) {
  return useApi(() => apiClient.getLead(id), [id]);
}

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLead = async (leadData: {
    name: string;
    email: string;
    phone: string;
    userId: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createLead(leadData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      setLoading(false);
      return { success: false, message: getErrorMessage(error, 'Failed to create lead') };
    } finally {
      setLoading(false);
    }
  };

  return { createLead, loading, error };
}

// Deals hooks
export function useDeals(params?: {
  page?: number;
  limit?: number;
  stage?: string;
  userId?: string;
}) {
  return useApi(() => apiClient.getDeals(params), [params]);
}

export function useDeal(id: string) {
  return useApi(() => apiClient.getDeal(id), [id]);
}

export function useCreateDeal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDeal = async (dealData: {
    title: string;
    value?: number;
    stage?: string;
    userId: string;
    leadId: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createDeal(dealData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      setLoading(false);
      return { success: false, message: getErrorMessage(error, 'Failed to create deal') };
    } finally {
      setLoading(false);
    }
  };

  return { createDeal, loading, error };
}

// Dashboard hooks
export function useDashboard() {
  return useApi(() => apiClient.getDashboardSummary(), []);
}

export function useRevenueAnalytics(period?: string) {
  return useApi(() => apiClient.getRevenueAnalytics({ period }), [period]);
}

// AI hooks
export function useAiDashboard() {
  return useApi(() => apiClient.getAiDashboard(), []);
}

export function useLeadScoring() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoreLead = async (leadId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.scoreLead(leadId);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      setLoading(false);
      return { success: false, message: getErrorMessage(error, 'Failed to score lead') };
    } finally {
      setLoading(false);
    }
  };

  return { scoreLead, loading, error };
}

// Notifications hooks
export function useNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}) {
  return useApi(() => apiClient.getNotifications(params), [params]);
}

export function useUnreadCount() {
  return useApi(() => apiClient.getUnreadCount(), []);
}

export function useNotificationMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsRead = async (id: string) => {
    try {
      setLoading(true);
      await apiClient.markNotificationRead(id);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to mark as read'));
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await apiClient.markAllNotificationsRead();
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to mark all as read'));
    } finally {
      setLoading(false);
    }
  };

  return { markAsRead, markAllAsRead, loading, error };
}

// Time tracking hooks
export function useTimeTracking(date?: string) {
  return useApi(() => apiClient.getTimeTracking({ date }), [date]);
}

export function useTimeTrackingActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const startTimeTracking = async (data?: { ip?: string; userAgent?: string }) => {
    try {
      setLoading(true);
      const response = await apiClient.startTimeTracking(data);
      if (response.success) {
        setIsTracking(true);
      }
      return { success: response.success };
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to start time tracking'));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const stopTimeTracking = async () => {
    try {
      setLoading(true);
      const response = await apiClient.stopTimeTracking();
      if (response.success) {
        setIsTracking(false);
      }
      return { success: response.success };
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to stop time tracking'));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateHeartbeat = async () => {
    try {
      await apiClient.updateHeartbeat();
    } catch (error) {
      console.error('Heartbeat update failed:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(updateHeartbeat, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking]);

  return {
    startTimeTracking,
    stopTimeTracking,
    isTracking,
    loading,
    error
  };
}
