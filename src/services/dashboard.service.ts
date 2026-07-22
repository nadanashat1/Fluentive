import { fetchDashboardData, DashboardMetrics } from '@/lib/dashboard/dashboard-data-layer';

export const dashboardService = {
  getSummary: async (range: string = '7d'): Promise<DashboardMetrics> => {
    return fetchDashboardData(range);
  },
  
  // Potential for more specific analytics calls
  getDetailedLeads: async () => {
    // Implement detailed leads analytics if needed
  }
};
