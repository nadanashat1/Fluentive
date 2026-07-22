import { AppErrorResponse } from './errors';

// ==========================================
// CENTRALIZED ENTERPRISE API CLIENT
// Prevents silent crashes, handles auth, retry logic, and standardized responses.
// ==========================================

interface ClientOptions extends RequestInit {
  data?: any;
  retries?: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options: ClientOptions = {}): Promise<T> {
    const { data, retries = 0, headers: customHeaders, ...customConfig } = options;

    const config: RequestInit = {
      ...customConfig,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(endpoint, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      
      let payload: any = null;
      if (isJson) {
        payload = await response.json();
      }

      // Handle successful responses
      if (response.ok) {
        // Our normalized APIs return { success: true, data: ... }
        return (payload?.data !== undefined ? payload.data : payload) as T;
      }

      // Handle specific HTTP statuses
      if (response.status === 401) {
        // Auth handled via Next.js middleware or AuthContext, but we can trigger a global event here
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }

      // Build standardized error
      const errorPayload = payload as AppErrorResponse;
      const errorMessage = errorPayload?.error?.message || response.statusText || 'API Error';
      
      throw new Error(errorMessage);

    } catch (error: any) {
      // Retry logic for network failures (not HTTP 4xx/5xx)
      if (retries > 0 && !error.message?.includes('401') && !error.message?.includes('403')) {
        console.warn(`[ApiClient] Retrying ${endpoint}... (${retries} attempts left)`);
        await new Promise(res => setTimeout(res, 1000));
        return this.request<T>(endpoint, { ...options, retries: retries - 1 });
      }

      console.error(`[ApiClient] Error on ${config.method || 'GET'} ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: Omit<ClientOptions, 'body' | 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data: any, options?: Omit<ClientOptions, 'data' | 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  put<T>(endpoint: string, data: any, options?: Omit<ClientOptions, 'data' | 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  }

  patch<T>(endpoint: string, data: any, options?: Omit<ClientOptions, 'data' | 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', data });
  }

  delete<T>(endpoint: string, options?: Omit<ClientOptions, 'body' | 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
