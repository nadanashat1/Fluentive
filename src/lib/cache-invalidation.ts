// Cache Invalidation Strategies
// Smart cache management for React Query + apiClient integration

import { queryClient } from './react-query-provider';

// Global cache invalidation strategies
export const cacheKeys = {
  // Auth-related
  auth: ['auth'] as const,
  user: (id?: string) => (id ? (['user', id] as const) : (['user'] as const)),
  
  // Data entities
  leads: ['leads'] as const,
  lead: (id: string) => ['leads', id] as const,
  users: ['users'] as const,
  userProfile: (id: string) => ['users', id] as const,
  deals: ['deals'] as const,
  deal: (id: string) => ['deals', id] as const,
  
  // Dashboard and analytics
  dashboard: ['dashboard'] as const,
  stats: ['stats'] as const,
  
  // Notifications
  notifications: ['notifications'] as const,
};

// Cache invalidation utilities
export const invalidateCache = {
  // Invalidate everything (use sparingly)
  all: () => queryClient.invalidateQueries(),
  
  // Invalidate auth-related data
  auth: () => queryClient.invalidateQueries({ queryKey: cacheKeys.auth }),
  auser: (id: string) => queryClient.invalidateQueries({ queryKey: cacheKeys.user(id) }),
  
  // Invalidate entity data
  leads: () => queryClient.invalidateQueries({ queryKey: cacheKeys.leads }),
  lead: (id: string) => queryClient.invalidateQueries({ queryKey: cacheKeys.lead(id) }),
  users: () => queryClient.invalidateQueries({ queryKey: cacheKeys.users }),
  userProfile: (id: string) => queryClient.invalidateQueries({ queryKey: cacheKeys.userProfile(id) }),
  deals: () => queryClient.invalidateQueries({ queryKey: cacheKeys.deals }),
  deal: (id: string) => queryClient.invalidateQueries({ queryKey: cacheKeys.deal(id) }),
  
  // Invalidate dashboard data
  dashboard: () => queryClient.invalidateQueries({ queryKey: cacheKeys.dashboard }),
  stats: () => queryClient.invalidateQueries({ queryKey: cacheKeys.stats }),
  
  // Invalidate notifications
  notifications: () => queryClient.invalidateQueries({ queryKey: cacheKeys.notifications }),
  
  // Smart invalidation - related data
  afterLeadChange: () => {
    // Lead changes affect dashboard stats and leads list
    queryClient.invalidateQueries({ queryKey: cacheKeys.leads });
    queryClient.invalidateQueries({ queryKey: cacheKeys.stats });
  },
  
  afterUserChange: () => {
    // User changes affect auth state and user data
    queryClient.invalidateQueries({ queryKey: cacheKeys.auth });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
  
  afterDealChange: () => {
    // Deal changes affect dashboard stats and deals list
    queryClient.invalidateQueries({ queryKey: cacheKeys.deals });
    queryClient.invalidateQueries({ queryKey: cacheKeys.stats });
  },
  
  afterAuthChange: () => {
    // Auth changes invalidate everything (user logged in/out)
    queryClient.clear();
  },
};

// Cache setting utilities
export const setCache = {
  // Set specific cache data (for optimistic updates)
  lead: (id: string, data: any) => {
    queryClient.setQueryData(cacheKeys.lead(id), data);
  },
  
  user: (data: any) => {
    queryClient.setQueryData(['users'], data);
  },
  
  dashboard: (data: any) => {
    queryClient.setQueryData(cacheKeys.dashboard, data);
  },
};

// Cache removal utilities
export const removeCache = {
  // Remove specific cache entry
  lead: (id: string) => {
    queryClient.removeQueries({ queryKey: cacheKeys.lead(id) });
  },
  
  user: (id: string) => {
    queryClient.removeQueries({ queryKey: cacheKeys.userProfile(id) });
  },
  
  // Clear all cache (logout)
  all: () => {
    queryClient.clear();
  },
};

// Prefetching utilities
export const prefetchCache = {
  // Prefetch data for better UX
  lead: async (id: string) => {
    // This would be implemented with the actual API call
    // await queryClient.prefetchQuery({ queryKey: cacheKeys.lead(id), queryFn: () => leads.get(id) });
  },
  
  dashboard: async () => {
    // await queryClient.prefetchQuery({ queryKey: cacheKeys.dashboard, queryFn: () => dashboard.summary() });
  },
};
