// Unified API Client - Single source of truth for all API calls
// Consolidates patterns from apiClient.ts, api.ts, and apiClient.ts
// Production-ready with error handling, deduplication, and type safety

import type { ZodSchema } from 'zod';
import { logError, generateRequestId } from './observability';
import { 
  Schemas,
  type BaseResponse,
  type UserDto,
  type LeadDto,
  type DealDto,
  type DashboardSummary,
  type DashboardStats,
  type ActivityDto,
  type NotificationDto
} from '@/types/dto';

// Environment configuration
const getEnv = () => {
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }
  return {} as Record<string, string | undefined>;
};

const env = getEnv();
const API_BASE_URL = env.NEXT_PUBLIC_API_URL || "";
const isDev = env.NODE_ENV === "development";

// Error classes
export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string
  ) {
    super(message || `API Error ${status}`);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: string[],
    message: string = 'Validation Error'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Request deduplication for GET requests only
const inFlightRequests = new Map<string, Promise<any>>();

function dedupedRequest<T>(key: string, requestFn: () => Promise<T>, isMutation: boolean = false): Promise<T> {
  // Never dedupe mutations - they must always execute
  if (isMutation) {
    return requestFn();
  }
  
  // Only dedupe GET requests for safety
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }
  
  const promise = requestFn()
    .finally(() => {
      inFlightRequests.delete(key);
    });
  
  inFlightRequests.set(key, promise);
  return promise;
}

// URL builder
function buildApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  let cleanPath = path.startsWith("/") ? path.substring(1) : path;

  if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring("api/".length);
  }

  if (!API_BASE_URL) {
    return `/api/${cleanPath}`;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}/api/${cleanPath}`;
}

// Enhanced fetch with validation and error handling
async function enhancedFetch<T>(
  url: string,
  schema?: ZodSchema<T>,
  options: RequestInit = {}
): Promise<T> {
  let authHeader: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || localStorage.getItem("dfluency.token") || "";
    if (token) {
      authHeader["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    let message = response.statusText || `HTTP ${response.status}`;
    let parsedError = null;
    
    try {
      parsedError = JSON.parse(errorText);
      message = parsedError?.message || parsedError?.error || message;
    } catch {
      // ignore
    }

    throw new ApiError(response.status, parsedError || errorText, message);
  }

  const data = await response.json();
  
  // Validate with schema if provided
  if (schema) {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? [error.message] : ['Validation failed'],
        'Response validation failed'
      );
    }
  }

  return data;
}

// Main unified API client
export async function unifiedApiClient<T>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    schema?: ZodSchema<T>;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { method = 'GET', body, schema, headers, signal } = options;
  
  // Generate request ID for tracing
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Create deduplication key (URL + method + body hash)
  const dedupeKey = `${method}:${url}:${JSON.stringify(body || '')}`;
  
  // Determine if this is a mutation
  const isMutation = method !== 'GET' && method !== undefined;
  
  return dedupedRequest(dedupeKey, async () => {
    // Set up timeout
    let timeoutId: NodeJS.Timeout | null = null;
    const abortController = new AbortController();
    const finalSignal = signal || abortController.signal;
    
    if (!signal) {
      timeoutId = setTimeout(() => {
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
        logError(new Error('Request timeout after 15 seconds'), { 
          requestId, 
          url, 
          method,
          duration: Date.now() - startTime 
        });
      }, 15000);
    }
    
    try {
      const fullUrl = buildApiUrl(url);
      
      if (isDev) {
        console.log(`[API] ${requestId} ${method} ${fullUrl}`);
      }
      
      const requestOptions: RequestInit = {
        method,
        signal: finalSignal,
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      };
      
      if (body && method !== 'GET') {
        requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      
      const result = await enhancedFetch<T>(fullUrl, schema, requestOptions);
      
      if (isDev) {
        console.log(`[API] ${requestId} completed (${Date.now() - startTime}ms)`);
      }
      
      return result;
    } catch (error) {
      logError(error, { 
        requestId, 
        url, 
        method,
        duration: Date.now() - startTime 
      });
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }, isMutation);
}

// Convenience methods
export const api = {
  get: <T>(url: string, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'GET', schema }),
    
  post: <T>(url: string, body: any, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'POST', body, schema }),
    
  put: <T>(url: string, body: any, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'PUT', body, schema }),
    
  patch: <T>(url: string, body: any, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'PATCH', body, schema }),
    
  delete: <T>(url: string, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'DELETE', schema })
};

// Safe wrapper that returns null on error
export const safeApi = {
  get: <T>(url: string, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'GET', schema }).catch(() => null),
    
  post: <T>(url: string, body: any, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'POST', body, schema }).catch(() => null),
    
  put: <T>(url: string, body: any, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'PUT', body, schema }).catch(() => null),
    
  patch: <T>(url: string, body: any, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'PATCH', body, schema }).catch(() => null),
    
  delete: <T>(url: string, schema?: ZodSchema<T>) => 
    unifiedApiClient<T>(url, { method: 'DELETE', schema }).catch(() => null)
};

// Export the main client function for advanced usage
export default unifiedApiClient;
