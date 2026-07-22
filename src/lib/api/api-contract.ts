// ✅ UNIFIED API CONTRACT - Production-grade response structure
// All API endpoints must return this standardized format

import type { User } from '@/types';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface AuthResult {
  user: User | null;
  error?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TOKEN' | 'SESSION_EXPIRED';
}

export interface NormalizedDashboardData {
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
    activeDeals: number;
    pipelineValue: number;
    statusBreakdown: Array<{ status: string; count: number }>;
    sourceBreakdown: Array<{ source: string; count: number }>;
    activityLogs: Array<{ id: string; action: string; timestamp: string }>;
    dailyLeadCounts: Array<{ date: string; count: number }>;
  };
  ai: {
    monthlyTrends: Array<{ month: string; revenue: number }>;
    overview: {
      totalLeadsScored: number;
      averageScore: number;
      highPriorityCount: number;
      conversionReadyCount: number;
      needsAttentionCount: number;
      predictedConversionsThisWeek: number;
    };
    topOpportunities: Array<{
      leadId: string;
      name: string;
      score: number;
      status: string;
      recommendedAction: string;
    }>;
    scoreDistribution?: number[];
  };
  timeTracking: {
    today: {
      totalHours: string;
      isActive: boolean;
    };
    weekly: {
      totalHours: string;
    };
  };
}

// ✅ Standardized response factory functions
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(error: string, data: any = null): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error,
    timestamp: new Date().toISOString()
  };
}

export function createAuthResponse(user: User | null, error?: AuthResult['error']): AuthResult {
  return {
    user,
    error
  };
}
