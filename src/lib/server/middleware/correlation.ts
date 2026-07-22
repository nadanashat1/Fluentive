import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/server/logger';

export interface CorrelationContext {
  correlationId: string;
  request: NextRequest;
}

// Generate correlation ID and add to request headers
export function addCorrelationId(request: NextRequest): string {
  const correlationId = crypto.randomUUID();
  
  // Add to request headers for downstream services
  request.headers.set('x-correlation-id', correlationId);
  
  return correlationId;
}

// Middleware wrapper for correlation tracking
export async function withCorrelation<T>(
  request: NextRequest,
  handler: (context: CorrelationContext) => Promise<T>
): Promise<T> {
  const correlationId = addCorrelationId(request);
  
  try {
    const result = await handler({
      correlationId,
      request
    });
    
    return result;
  } catch (error) {
    // Log error with correlation ID
    await logger.error('Request failed', {
      userId: undefined,
      correlationId,
      endpoint: request.url,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: request.method,
        url: request.url
      }
    });
    
    throw error;
  }
}

// Helper to extract correlation ID from headers
export function getCorrelationId(request: NextRequest): string | null {
  return request.headers.get('x-correlation-id');
}
