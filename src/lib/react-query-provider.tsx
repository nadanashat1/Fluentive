// React Query Provider - Data lifecycle engine
// Integrates with our failure-resilient apiClient

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// React Query Devtools - Commented out for production build
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

// Create a client with production-ready configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time-based data management (REALTIME CRM UPGRADE)
      staleTime: 30 * 1000, // 30 seconds - balanced freshness without over-fetching
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true, // Fetch fresh data when user returns to app
      refetchOnReconnect: true,
      retry: false, // Let our apiClient handle retries
      
      // Error handling
      throwOnError: false, 
      
      // REMOVED: Global refetchInterval was causing 60+ API calls/minute/user
      // Individual queries (dashboard, time-tracking) set their own polling intervals
      refetchIntervalInBackground: false, // Save battery when tab is hidden
      
      // Performance
      // suspense: false, // Disabled for now, can enable later
    },
    mutations: {
      // Mutations use our apiClient retry logic
      retry: false,
      throwOnError: false,
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        // ReactQueryDevtools component commented out for production
        // <ReactQueryDevtools initialIsOpen={false} />
        null
      )}
    </QueryClientProvider>
  );
}

// Export the client for direct access when needed
export { queryClient };
