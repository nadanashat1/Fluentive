// ✅ FRONTEND DATA LAYER - Production-grade normalization
// Prevents silent data failures and provides consistent data structure

import type { NormalizedDashboardData } from '@/lib/api/api-contract';
import type { DashboardMetrics } from '@/lib/dashboard/dashboard-data-layer';

export function normalizeDashboardData(metrics: DashboardMetrics | null): NormalizedDashboardData {
  if (!metrics) {
    return createEmptyDashboardData();
  }

  return {
    leads: {
      total: metrics.leads?.total ?? 0,
      converted: metrics.leads?.converted ?? 0,
      conversionRate: metrics.leads?.conversionRate ?? 0,
      activeDeals: metrics.leads?.activeDeals ?? 0,
      pipelineValue: metrics.leads?.pipelineValue ?? 0,
      statusBreakdown: metrics.leads?.byStatus ?? [],
      sourceBreakdown: metrics.leads?.bySource ?? [],
      activityLogs: metrics.engagement?.recent ?? [],
      dailyLeadCounts: metrics.leads?.daily ?? []
    },
    ai: {
      monthlyTrends: metrics.ai?.monthlyTrends ?? [],
      overview: {
        totalLeadsScored: metrics.ai?.overview?.totalLeadsScored ?? 0,
        averageScore: metrics.ai?.overview?.averageScore ?? 0,
        highPriorityCount: metrics.ai?.overview?.highPriorityCount ?? 0,
        conversionReadyCount: metrics.ai?.overview?.conversionReadyCount ?? 0,
        needsAttentionCount: metrics.ai?.overview?.needsAttentionCount ?? 0,
        predictedConversionsThisWeek: metrics.ai?.overview?.predictedConversionsThisWeek ?? 0
      },
      topOpportunities: metrics.ai?.topOpportunities ?? [],
      scoreDistribution: metrics.ai?.scoreDistribution ?? []
    },
    timeTracking: {
      today: {
        totalHours: metrics.timeTracking?.today?.totalHours ?? "0.00",
        isActive: metrics.timeTracking?.today?.isActive ?? false
      },
      weekly: {
        totalHours: metrics.timeTracking?.weekly?.totalHours ?? "0.00"
      }
    }
  };
}

function createEmptyDashboardData(): NormalizedDashboardData {
  return {
    leads: {
      total: 0,
      converted: 0,
      conversionRate: 0,
      activeDeals: 0,
      pipelineValue: 0,
      statusBreakdown: [],
      sourceBreakdown: [],
      activityLogs: [],
      dailyLeadCounts: []
    },
    ai: {
      monthlyTrends: [],
      overview: {
        totalLeadsScored: 0,
        averageScore: 0,
        highPriorityCount: 0,
        conversionReadyCount: 0,
        needsAttentionCount: 0,
        predictedConversionsThisWeek: 0
      },
      topOpportunities: [],
      scoreDistribution: []
    },
    timeTracking: {
      today: {
        totalHours: "0.00",
        isActive: false
      },
      weekly: {
        totalHours: "0.00"
      }
    }
  };
}

// ✅ AI Data normalization - prevents silent failures
export function normalizeAiData(aiData: any) {
  return {
    monthlyTrends: aiData?.monthlyTrends ?? [],
    revenue: aiData?.revenue ?? 0,
    score: aiData?.score ?? 0,
    overview: aiData?.overview ?? {
      totalLeadsScored: 0,
      averageScore: 0,
      highPriorityCount: 0,
      conversionReadyCount: 0,
      needsAttentionCount: 0,
      predictedConversionsThisWeek: 0
    },
    topOpportunities: aiData?.topOpportunities ?? []
  };
}
