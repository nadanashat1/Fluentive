// Pure HTTP client — auth refresh delegated to AuthKernel on 401

import { createCorrelationId } from "@/lib/observability/correlation";

export class HttpError extends Error {
  constructor(public status: number, message?: string) {
    super(message || `HTTP ${status}`);
    this.name = "HttpError";
  }
}

export class ApiError extends HttpError {
  constructor(status: number, message?: string) {
    super(status, message);
    this.name = "ApiError";
  }
}

const getEnv = () => {
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }
  return {} as Record<string, string | undefined>;
};

const env = getEnv();
const API_BASE_URL = env.NEXT_PUBLIC_API_URL || "";
const isDev = env.NODE_ENV === "development";

function buildApiUrl(path: string): string {
  let cleanPath = path.startsWith("/") ? path.substring(1) : path;

  if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring("api/".length);
  }

  if (!API_BASE_URL) {
    return `/api/${cleanPath}`;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}/api/${cleanPath}`;
}

function isAuthEndpoint(url: string): boolean {
  return /\/api\/auth\/(login|logout|refresh|register|forgot-password|reset-password)/.test(url);
}

function readBearerFromStorage(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("dfluency.token") ||
    ""
  );
}

async function tryRefreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { authKernel, AuthState } = await import("@/lib/auth/auth-kernel");
    const state = authKernel.getState();
    if (state.status === AuthState.EXPIRED) {
      return false;
    }
    if (
      state.status === AuthState.AUTHENTICATED ||
      state.status === AuthState.REFRESHING ||
      state.status === AuthState.HYDRATING
    ) {
      await authKernel.refreshToken();
      return authKernel.getState().status === AuthState.AUTHENTICATED;
    }
    // Cookie session may be valid before kernel bootstrap (e.g. finance settings on direct load)
    const res = await fetch(buildApiUrl("auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    try {
      await authKernel.refreshToken();
    } catch {
      // Kernel sync optional; cookies were refreshed
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchWithAuth(
  url: string,
  options: RequestInit,
  allowRetry: boolean
): Promise<Response> {
  const token = readBearerFromStorage();
  const correlationId = createCorrelationId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Correlation-Id": correlationId,
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (
    response.status === 401 &&
    allowRetry &&
    typeof window !== "undefined" &&
    !isAuthEndpoint(url)
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return fetchWithAuth(url, options, false);
    }
  }

  return response;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(path);

  if (isDev) {
    console.log(`[API Request] ${options.method || "GET"} ${url}`);
  }

  const response = await fetchWithAuth(url, options, true);

  if (isDev) {
    console.log(`[API Response] ${url} - Status: ${response.status}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    if (isDev) {
      console.error(`[API Error] ${url}:`, errorText);
    }

    let message = response.statusText || `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed?.message || parsed?.error || message;
    } catch {
      // ignore
    }

    throw new HttpError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export async function safeFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (isDev) {
      console.error("Fetch error:", error);
    }
    return null;
  }
}

export { API_BASE_URL };
