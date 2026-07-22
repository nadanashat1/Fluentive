// === AUTHENTICATED API HOOK ===
// Hook for components to delay API calls until user is authenticated

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-production';
import { shouldDelayApiCalls, waitForAuth } from '@/lib/auth-api-client';

/**
 * Hook that returns whether API calls should be delayed
 * and provides a stable way to wait for authentication
 */
export function useAuthenticatedApi() {
  const { state, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only ready when not in hydrating/idle state
    const ready = !shouldDelayApiCalls();
    setIsReady(ready);
  }, [state.status]);

  /**
   * Execute an API call only when authenticated
   * Returns null if not authenticated
   */
  const executeIfAuthenticated = async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      return await apiCall();
    } catch (error) {
      console.error('[useAuthenticatedApi] API call failed:', error);
      throw error;
    }
  };

  /**
   * Wait for authentication before executing API call
   */
  const executeWhenAuthenticated = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    if (!isAuthenticated) {
      await waitForAuth();
    }

    return apiCall();
  };

  return {
    isReady,
    isAuthenticated,
    shouldDelay: shouldDelayApiCalls(),
    executeIfAuthenticated,
    executeWhenAuthenticated
  };
}

/**
 * Simple hook that just returns whether to delay API calls
 */
export function useShouldDelayApi() {
  const { state } = useAuth();
  return state.status === 'hydrating' || state.status === 'idle';
}
