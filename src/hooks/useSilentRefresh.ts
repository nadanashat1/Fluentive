"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext-production';
import { authenticatedFetch } from '@/lib/api/auth-interceptor';

interface SilentRefreshConfig {
  enabled: boolean;
  refreshInterval: number; // in milliseconds
  warningThreshold: number; // minutes before expiry to warn
}

export function useSilentRefresh(config: SilentRefreshConfig = {
  enabled: true,
  refreshInterval: 14 * 60 * 1000, // 14 minutes
  warningThreshold: 5, // 5 minutes
}) {
  const { refreshSession, isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !config.enabled) {
      // Clear intervals if not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      return;
    }

    // Set up dynamic refresh based on token expiry
    const scheduleRefresh = async () => {
      try {
        // Get current token to extract expiry
        const cookies = document.cookie.split(';');
        let accessToken = null;
        
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'accessToken') {
            accessToken = value;
            break;
          }
        }

        if (!accessToken) {
          throw new Error('No access token found');
        }

        // Decode JWT to get expiry
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const exp = payload.exp;
        
        if (!exp) {
          throw new Error('Token has no expiry');
        }

        // Calculate refresh time (1 minute before expiry)
        const now = Date.now();
        const expiryTime = exp * 1000;
        const refreshTime = expiryTime - now - 60_000; // 1 minute before expiry

        if (refreshTime <= 0) {
          // Token expires soon, refresh immediately
          await refreshSession();
          // Reschedule after successful refresh
          scheduleRefresh();
        } else {
          // Schedule refresh for calculated time
          warningTimeoutRef.current = setTimeout(async () => {
            try {
              await refreshSession();
              console.log('Session refreshed silently based on token expiry');
              // Reschedule after successful refresh
              scheduleRefresh();
            } catch (error) {
              console.error('Silent refresh failed:', error);
              // If refresh fails, user will be logged out automatically
            }
          }, refreshTime);
        }

      } catch (error) {
        console.error('Failed to schedule refresh:', error);
        // Fallback to static interval if token parsing fails
        intervalRef.current = setInterval(async () => {
          try {
            await refreshSession();
            console.log('Session refreshed silently (fallback)');
          } catch (error) {
            console.error('Silent refresh failed:', error);
          }
        }, config.refreshInterval);
      }
    };

    scheduleRefresh();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isAuthenticated, config.enabled, config.refreshInterval, refreshSession]);

  // Function to manually trigger refresh
  const manualRefresh = async () => {
    try {
      await refreshSession();
      return true;
    } catch (error) {
      console.error('Manual refresh failed:', error);
      return false;
    }
  };

  return {
    manualRefresh,
    isRefreshing: intervalRef.current !== null,
  };
}
