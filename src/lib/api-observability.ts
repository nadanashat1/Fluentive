// API Observability - Global logging and monitoring
// Critical for production debugging and visibility

export interface ApiEvent {
  url: string;
  method?: string;
  status?: number;
  error?: unknown;
  duration?: number;
  retryCount?: number;
  userAgent?: string;
}

let isRefreshing = false;

export function logApiEvent(event: ApiEvent) {
  const timestamp = new Date().toISOString();
  
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.group(`[API Event] ${event.method || 'GET'} ${event.url}`);
    console.log('Timestamp:', timestamp);
    console.log('Status:', event.status);
    console.log('Duration:', event.duration ? `${event.duration}ms` : 'N/A');
    console.log('Retry Count:', event.retryCount || 0);
    if (event.error) {
      console.error('Error:', event.error);
    }
    console.groupEnd();
  }

  // Production logging (hook for external services)
  if (process.env.NODE_ENV === 'production') {
    // 🔥 Later: Send to Sentry, LogRocket, Datadog, etc.
    // Example:
    // Sentry.captureMessage('API Error', {
    //   extra: event,
    //   tags: { api: true }
    // });
    
    const isFailure = Boolean(event.error) || (typeof event.status === 'number' && event.status >= 400);

    if (isFailure) {
      console.error('[API Error]', {
        timestamp,
        ...event
      });
    }
  }
}

export function logApiRequest(url: string, method?: string) {
  return {
    url,
    method,
    timestamp: Date.now()
  };
}

export function logApiResponse(requestStart: any, status: number, error?: unknown) {
  const duration = Date.now() - requestStart.timestamp;
  
  logApiEvent({
    url: requestStart.url,
    method: requestStart.method,
    status,
    duration,
    error
  });
}

export function setAuthRefreshState(refreshing: boolean) {
  isRefreshing = refreshing;
}

export function getAuthRefreshState() {
  return isRefreshing;
}
