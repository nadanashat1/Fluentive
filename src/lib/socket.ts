// Polling-based realtime updates (Vercel-compatible)
// Replaced socket.io with simple polling for serverless compatibility

import { api } from './unified-api-client';

type EventCallback = (data: any) => void;

const listeners: Map<string, EventCallback[]> = new Map();
let pollIntervals: Map<string, number> = new Map();

// Simulate socket.io API with polling
export function getSocket(userId?: string) {
  return {
    emit: (event: string, data?: any) => {
      // Client-side emit - send to API
      api.post('/socket-emit', { event, data, userId }).catch(() => {});
    },
    on: (event: string, callback: EventCallback) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)?.push(callback);
    },
    off: (event: string, callback: EventCallback) => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    },
    disconnect: () => {
      // Clear all intervals
      pollIntervals.forEach((id) => clearInterval(id));
      pollIntervals.clear();
    }
  };
}

// Subscribe to polling updates
export function subscribeToPolling(
  endpoint: string,
  intervalMs: number,
  onData: (data: any) => void,
  onError?: (error: any) => void
): () => void {
  const fetchData = async () => {
    try {
      const data = await api.get(endpoint);
      onData(data);
    } catch (error: any) {
      // Stop polling on 401 (unauthorized) and clear data
      if (error?.status === 401 || error?.response?.status === 401) {
        const intervalId = pollIntervals.get(endpoint);
        if (intervalId) {
          clearInterval(intervalId);
          pollIntervals.delete(endpoint);
        }
        onData(null); // Clear data
        if (onError) onError(error);
        return;
      }
      // Silently fail on other errors - polling should be resilient
    }
  };

  // Initial fetch
  fetchData();

  // Set up polling
  const intervalId = window.setInterval(fetchData, intervalMs);
  pollIntervals.set(endpoint, intervalId);

  // Return unsubscribe function
  return () => {
    clearInterval(intervalId);
    pollIntervals.delete(endpoint);
  };
}

export function disconnectSocket(): void {
  pollIntervals.forEach((id) => clearInterval(id));
  pollIntervals.clear();
  listeners.clear();
}
