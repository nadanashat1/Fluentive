import { useState, useEffect } from "react";
import { safeFetch } from "../lib/api-client";
import { eventBus } from "../core/eventBus";
import type { APIState } from "../types/api-state";
import { createErrorState, createLoadingState, createSuccessState } from "../types/api-state";

interface HealthStatus {
  server: string;
  database: string;
  timestamp: string;
  uptime: number;
  environment: string;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
}

/**
 * Health Check Hook
 * 
 * Monitors backend health status including database connection.
 * Triggers offline state when backend is unavailable.
 * Emits events to event bus for reactive UI updates.
 */
export function useHealthCheck(interval: number = 30000) {
  const [state, setState] = useState<APIState<HealthStatus>>(createLoadingState());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      const result = await safeFetch<HealthStatus>('/health');

      if (result === null) {
        setState(createErrorState("Health check failed"));
        setIsOnline(false);
        eventBus.emit("db:status", {
          status: "error",
          error: "Health check failed",
        });
        return;
      }

      setState(createSuccessState(result));

      const online = result.database === 'connected';
      setIsOnline(online);
      
      // Emit to event bus for reactive updates
      eventBus.emit("db:status", { 
        status: online ? "connected" : "disconnected",
        data: result 
      });
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return { state, isOnline };
}
