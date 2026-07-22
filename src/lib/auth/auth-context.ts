// 🚀 Enterprise Auth Context - Unified Request Pipeline
// Ensures every request has consistent auth context across client/server/proxy

import { NextRequest } from 'next/server';

// ✅ CRITICAL: Unified auth context for all request sources
export interface AuthContext {
  headers: {
    cookie?: string;
    authorization?: string;
    'x-forwarded-for'?: string;
    'x-real-ip'?: string;
    'user-agent'?: string;
  };
  metadata: {
    source: 'browser' | 'server' | 'proxy' | 'background';
    timestamp: number;
    requestId: string;
  };
}

// ✅ CRITICAL: Extract auth context from any request source
export function getAuthContext(request: NextRequest): AuthContext {
  const cookie = request.headers.get('cookie') || '';
  const authorization = request.headers.get('authorization') || '';
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const realIp = request.headers.get('x-real-ip') || '';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Determine request source
  const source = determineRequestSource(request);
  
  return {
    headers: {
      cookie,
      authorization,
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIp,
      'user-agent': userAgent,
    },
    metadata: {
      source,
      timestamp: Date.now(),
      requestId: generateRequestId(),
    },
  };
}

// ✅ CRITICAL: Determine request source for proper auth handling
function determineRequestSource(request: NextRequest): 'browser' | 'server' | 'proxy' | 'background' {
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // Background jobs typically have no user agent or specific patterns
  if (!userAgent || userAgent.includes('node') || userAgent.includes('fetch')) {
    return 'background';
  }
  
  // Proxy requests typically have forwarded headers
  if (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')) {
    return 'proxy';
  }
  
  // Server-side requests typically have internal patterns
  if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
    return 'server';
  }
  
  // Default to browser
  return 'browser';
}

// ✅ CRITICAL: Generate unique request ID for tracing
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ✅ CRITICAL: Create proxy request with full auth context
export function createProxyRequest(url: string, authContext: AuthContext): RequestInit {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authContext.headers.cookie || '',
      'Authorization': authContext.headers.authorization || '',
      'X-Forwarded-For': authContext.headers['x-forwarded-for'] || '',
      'X-Real-IP': authContext.headers['x-real-ip'] || '',
      'User-Agent': authContext.headers['user-agent'] || '',
      'X-Request-ID': authContext.metadata.requestId,
      'X-Request-Source': authContext.metadata.source,
    },
    credentials: 'include' as RequestCredentials,
  };
}

// ✅ CRITICAL: Validate auth context completeness
export function validateAuthContext(authContext: AuthContext): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check for essential auth headers
  if (!authContext.headers.cookie && !authContext.headers.authorization) {
    missing.push('cookie or authorization');
  }
  
  // Check for source identification
  if (!authContext.metadata.source) {
    missing.push('request source');
  }
  
  // Warnings for background jobs without auth
  if (authContext.metadata.source === 'background' && !authContext.headers.cookie) {
    warnings.push('background job without auth context');
  }
  
  // Warnings for missing request ID
  if (!authContext.metadata.requestId) {
    warnings.push('missing request ID for tracing');
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

// ✅ CRITICAL: Log auth context for debugging
export function logAuthContext(authContext: AuthContext, operation: string): void {
  if (process.env.NODE_ENV === 'development') {
    // ✅ FIXED: Check for accessToken in cookies, not just authorization header
    const hasAccessToken = authContext.headers.cookie?.includes('accessToken=') || false;
    
    console.log(`[AuthContext] ${operation}:`, {
      source: authContext.metadata.source,
      requestId: authContext.metadata.requestId,
      hasCookie: !!authContext.headers.cookie,
      hasAuth: hasAccessToken, // ✅ FIXED: Check accessToken cookie directly
      timestamp: new Date(authContext.metadata.timestamp).toISOString(),
    });
  }
}

// ✅ CRITICAL: Create server-side auth context fallback
export function createServerAuthContext(): AuthContext {
  return {
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'x-real-ip': '127.0.0.1',
      'user-agent': 'Next.js Server',
    },
    metadata: {
      source: 'server',
      timestamp: Date.now(),
      requestId: generateRequestId(),
    },
  };
}
