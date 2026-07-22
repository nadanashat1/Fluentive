import { NextRequest, NextResponse } from 'next/server';
import { UnauthorizedError, ForbiddenError } from './auth';
import { ZodError } from 'zod';
import { runWithContext, RequestContext, getContext } from './request-context';
import { createApiError } from './api-responses';
import { eventProvider } from './providers';

/** Generate a short unique request ID for tracing */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

export function withApiHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const requestId = generateRequestId();
    const startTime = performance.now();
    const route = request.nextUrl.pathname;
    const method = request.method;

    const context: RequestContext = {
      requestId,
      route,
      method,
      startTime,
      // Assume nodejs runtime by default, edge routes can override this
      runtime: 'nodejs' 
    };

    return runWithContext(context, async () => {
      // Attach requestId to response headers for client-side correlation
      const addHeaders = (response: NextResponse, status: number, error?: string, errorCode?: string) => {
        const latencyMs = Math.round(performance.now() - startTime);
        context.duration = latencyMs;
        
        response.headers.set('X-Request-Id', requestId);
        response.headers.set('X-Response-Time', `${latencyMs}ms`);

        // Emit standard request event
        const severity = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
        eventProvider.emit({
          type: status >= 500 ? 'API_SERVER_ERROR' : status >= 400 ? 'API_CLIENT_ERROR' : 'API_REQUEST_SUCCESS',
          timestamp: new Date().toISOString(),
          severity,
          context,
          payload: {
            status,
            error,
            errorCode,
          }
        });

        // Also emit structured log for STDOUT (for Datadog/Axiom)
        const log = {
          requestId,
          route,
          method,
          status,
          latencyMs,
          userId: context.userId,
          organizationId: context.organizationId,
          error,
          errorCode,
          timestamp: new Date().toISOString(),
        };

        if (process.env.NODE_ENV === 'production') {
          console.log(JSON.stringify(log));
        } else {
          const color = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
          console.log(
            `${color} [${requestId}] ${method} ${route} → ${status} (${latencyMs}ms)` +
              (error ? ` | ${error}` : '')
          );
        }

        return response;
      };

      try {
        const response = await handler(request);
        return addHeaders(response, response.status);
      } catch (error: any) {
        if (error instanceof UnauthorizedError) {
          const res = createApiError(error.message || 'Unauthorized', 'UNAUTHORIZED', 401);
          return addHeaders(res, 401, error.message, 'UNAUTHORIZED');
        }

        if (error instanceof ForbiddenError) {
          const res = createApiError(error.message || 'Forbidden', 'FORBIDDEN', 403);
          return addHeaders(res, 403, error.message, 'FORBIDDEN');
        }

        if (error instanceof ZodError) {
          const res = createApiError('Validation failed', 'VALIDATION_ERROR', 400, error.errors);
          return addHeaders(res, 400, 'Validation failed', 'VALIDATION_ERROR');
        }

        // Default server error — never leak stack traces in production
        const safeMessage = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;

        const res = createApiError(safeMessage, 'INTERNAL_ERROR', 500);
        
        // Log the actual stack trace in development
        if (process.env.NODE_ENV !== 'production') {
          console.error(error);
        }

        return addHeaders(res, 500, error.message, 'INTERNAL_ERROR');
      }
    });
  };
}

// Preserve backwards compatibility for now while we migrate
export const withErrorHandler = withApiHandler;
