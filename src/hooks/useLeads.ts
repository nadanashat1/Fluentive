// React Query hooks for Leads
// Clean data lifecycle management with type-safe typed API

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedApi } from '@/services/typed-api.service';
import { queryKeys } from '@/lib/query-keys';
import { useQueryErrorBoundary } from '@/components/error-boundary';
import { DASHBOARD_QUERY_KEY } from '@/hooks/useDashboardAnalytics';
import type { LeadFilters, CreateLeadRequest, UpdateLeadRequest, LeadResponse, BaseResponse } from '@/types/dto';

// Hook for getting leads list
export function useLeads(filters: LeadFilters = { page: 1, limit: 10 }) {
  const { withErrorBoundary } = useQueryErrorBoundary();
  
  return useQuery(withErrorBoundary({
    queryKey: [...queryKeys.leads.list(), filters],
    queryFn: () => typedApi.leads.list(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - leads change frequently but not instantly
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchInterval: 3 * 60 * 1000, // Auto-refresh every 3 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh when connection restored
  }));
}

// Hook for getting lead details
export function useLead(id: string) {
  const { withErrorBoundary } = useQueryErrorBoundary();
  
  return useQuery(withErrorBoundary({
    queryKey: queryKeys.leads.detail(id),
    queryFn: () => typedApi.leads.get(id),
    staleTime: 5 * 60 * 1000, // 5 minutes - individual lead data changes less frequently
    gcTime: 20 * 60 * 1000, // 20 minutes cache time
    enabled: !!id, // Only run if we have an ID
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh when connection restored
  }));
}

// Hook for leads stats
export function useLeadsStats() {
  const { withErrorBoundary } = useQueryErrorBoundary();
  
  return useQuery(withErrorBoundary({
    queryKey: queryKeys.leads.stats(),
    queryFn: () => typedApi.leads.stats(),
    staleTime: 10 * 60 * 1000, // 10 minutes - stats change periodically
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh when connection restored
  }));
}

// Hook for creating lead mutation
export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation<LeadResponse, Error, CreateLeadRequest>({
    mutationFn: (data: CreateLeadRequest) => typedApi.leads.create(data),
    onMutate: async (newLead: CreateLeadRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.list() });
      
      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData(queryKeys.leads.list());
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.leads.list(), (old: any) => {
        if (!old) return [newLead];
        return [...old, { ...newLead, id: 'temp-' + Date.now(), createdAt: new Date().toISOString() }];
      });
      
      // Return a context object with the snapshotted value
      return { previousLeads };
    },
    onError: (err: Error, newLead: CreateLeadRequest, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(queryKeys.leads.list(), context?.previousLeads);
      console.error('Create lead failed:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}

// Hook for updating lead mutation
export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation<LeadResponse, Error, { id: string; data: UpdateLeadRequest }>({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadRequest }) => typedApi.leads.update(id, data),
    onMutate: async ({ id, data }: { id: string; data: UpdateLeadRequest }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.list() });
      
      // Snapshot the previous values
      const previousLead = queryClient.getQueryData(queryKeys.leads.detail(id));
      const previousLeads = queryClient.getQueryData(queryKeys.leads.list());
      
      // Optimistically update the specific lead
      queryClient.setQueryData(queryKeys.leads.detail(id), (old: any) => 
        old ? { ...old, ...data, updatedAt: new Date().toISOString() } : null
      );
      
      // Optimistically update the lead in the list
      queryClient.setQueryData(queryKeys.leads.list(), (old: any) => {
        if (!old) return old;
        return old.map((lead: any) => 
          lead.id === id ? { ...lead, ...data, updatedAt: new Date().toISOString() } : lead
        );
      });
      
      // Return context with snapshotted values
      return { previousLead, previousLeads };
    },
    onError: (err: Error, { id }: { id: string }, context: any) => {
      // Roll back on error
      queryClient.setQueryData(queryKeys.leads.detail(id), context?.previousLead);
      queryClient.setQueryData(queryKeys.leads.list(), context?.previousLeads);
      console.error('Update lead failed:', err);
    },
    onSettled: (_: any, __: any, { id }: { id: string }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}

// Hook for deleting lead mutation
export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation<BaseResponse, Error, string>({
    mutationFn: (id: string) => typedApi.leads.delete(id),
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.list() });
      
      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData(queryKeys.leads.list());
      
      // Optimistically remove the lead from the list
      queryClient.setQueryData(queryKeys.leads.list(), (old: any) => {
        if (!old) return old;
        return old.filter((lead: any) => lead.id !== id);
      });
      
      // Return context with snapshotted value
      return { previousLeads };
    },
    onError: (err: Error, id: string, context: any) => {
      // Roll back on error
      queryClient.setQueryData(queryKeys.leads.list(), context?.previousLeads);
      console.error('Delete lead failed:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}
