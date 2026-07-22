/**
 * Production Environment Optimizations for Vercel Hobby Plan
 * Ensures optimal performance and memory usage
 */

import { getErrorMessage } from '@/lib/utils/error';
export const PROD_CONFIG = {
  // Memory thresholds for Vercel Hobby (2048MB)
  MEMORY_THRESHOLDS: {
    WARNING: 60,    // 60% of heap
    CRITICAL: 80,   // 80% of heap
    EMERGENCY: 95,  // 95% of heap
    MAX_RESPONSE_SIZE: 512 * 1024, // 512KB max response
  },
  
  // Request timeouts (Vercel has 30s limit)
  TIMEOUTS: {
    DEFAULT: 20000,     // 20s default
    HEAVY: 15000,       // 15s for heavy queries
    LIGHT: 5000,        // 5s for lightweight
    AUTH: 10000,        // 10s for auth
  },
  
  // Pagination limits
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    HEAVY_LIMIT: 50,
  },
  
  // Rate limiting (requests per minute)
  RATE_LIMITS: {
    DEFAULT: 60,
    HEAVY: 30,
    AUTH: 20,
    UPLOAD: 10,
  },
  
  // Cache settings
  CACHE: {
    TTL: 5 * 60, // 5 minutes
    MAX_SIZE: 100, // Max 100 cached items
  }
};

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.VERCEL === '1';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const isProd = isProduction();
  
  return {
    isProduction: isProd,
    logLevel: isProd ? 'error' : 'info',
    enableDebugging: !isProd,
    enableMetrics: isProd,
    compressionEnabled: true,
    rateLimitEnabled: true,
    memoryMonitoringEnabled: true,
    timeoutMultiplier: isProd ? 1 : 2, // Double timeout in dev
  };
}

/**
 * Production-safe error logging
 */
export function logProduction(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const config = getEnvironmentConfig();
  
  if (!config.enableDebugging && level === 'info') return;
  if (!config.enableDebugging && level === 'warn') return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: process.env.NODE_ENV,
    ...(data && { data })
  };
  
  if (config.isProduction) {
    // In production, only log errors
    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    }
  } else {
    // In development, log everything
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Memory-safe JSON stringify
 */
export function safeJsonStringify(obj: any, maxSize: number = PROD_CONFIG.MEMORY_THRESHOLDS.MAX_RESPONSE_SIZE): string {
  try {
    const jsonString = JSON.stringify(obj);
    
    if (jsonString.length > maxSize) {
      logProduction('warn', 'Response size exceeds limit', {
        actualSize: jsonString.length,
        maxSize,
        truncated: true
      });
      
      // Return truncated version
      return JSON.stringify({
        success: false,
        error: 'Response too large',
        maxSize,
        actualSize: jsonString.length
      });
    }
    
    return jsonString;
  } catch (error) {
    logProduction('error', 'JSON stringify failed', { error: getErrorMessage(error) });
    return JSON.stringify({
      success: false,
      error: 'Internal serialization error'
    });
  }
}

/**
 * Production-safe response headers
 */
export function getProductionHeaders(customHeaders: Record<string, string> = {}): Headers {
  const headers = new Headers(customHeaders);
  const config = getEnvironmentConfig();
  
  // Add security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add performance headers
  headers.set('X-Response-Time', Date.now().toString());
  headers.set('X-Environment', config.isProduction ? 'production' : 'development');
  
  // Add compression headers
  if (config.compressionEnabled) {
    headers.set('X-Compression-Enabled', 'true');
  }
  
  // Add memory headers
  if (config.memoryMonitoringEnabled) {
    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    headers.set('X-Memory-Usage', usedMB.toString());
  }
  
  return headers;
}

/**
 * Validate request for production
 */
export function validateProductionRequest(req: Request): {
  valid: boolean;
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];
  const url = new URL(req.url);
  
  // Check for suspicious parameters
  const searchParams = url.searchParams;
  
  // Large limit values
  const limit = searchParams.get('limit');
  if (limit && (parseInt(limit) || 0) > PROD_CONFIG.PAGINATION.MAX_LIMIT) {
    warnings.push(`Limit ${limit} exceeds maximum ${PROD_CONFIG.PAGINATION.MAX_LIMIT}`);
  }
  
  // Very deep pagination
  const page = searchParams.get('page');
  if (page && (parseInt(page) || 0) > 1000) {
    warnings.push(`Page ${page} exceeds reasonable limit`);
  }
  
  // Suspicious search patterns
  const search = searchParams.get('search');
  if (search && search.length > 1000) {
    warnings.push('Search query too long');
  }
  
  // Check for potential DoS patterns
  const userAgent = req.headers.get('user-agent') || '';
  if (userAgent.includes('bot') || userAgent.includes('crawl') || userAgent.includes('spam')) {
    warnings.push('Suspicious user agent detected');
  }
  
  return {
    valid: warnings.length === 0,
    ...(warnings.length > 0 && { warnings })
  };
}

/**
 * Production middleware configuration
 */
export const PRODUCTION_MIDDLEWARE = {
  // Enable all optimizations in production
  memoryCheck: isProduction(),
  compression: true,
  rateLimit: true,
  timeout: true,
  validation: true,
  
  // Get middleware settings
  settings: () => ({
    memoryThreshold: PROD_CONFIG.MEMORY_THRESHOLDS.WARNING,
    timeoutMs: PROD_CONFIG.TIMEOUTS.DEFAULT,
    rateLimitPerMinute: PROD_CONFIG.RATE_LIMITS.DEFAULT,
    maxResponseSize: PROD_CONFIG.MEMORY_THRESHOLDS.MAX_RESPONSE_SIZE
  })
};
