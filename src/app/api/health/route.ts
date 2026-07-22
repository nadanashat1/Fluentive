import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeHandler, withTimeout } from '@/lib/server/safe-handler';
import { validateEnv } from '@/lib/server/env';

export async function GET() {
  return safeHandler(async () => {
    const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
    const startTime = Date.now();

    // Check environment variables
    const envStart = Date.now();
    try {
      const { valid, errors } = validateEnv();
      checks.environment = {
        status: valid ? 'ok' : 'error',
        latency: Date.now() - envStart,
        error: valid ? undefined : errors.join(', '),
      };
    } catch (error) {
      checks.environment = {
        status: 'error',
        error: 'Environment validation failed',
      };
    }

    // Check database connection with timeout (8s for Supabase cold start)
    const dbStart = Date.now();
    try {
      // Use a simple query that works across all databases
      await withTimeout(
        prisma.$queryRaw`SELECT 1 as health_check`,
        8000, // 8 second timeout for DB check (Supabase can be slow on cold start)
        'Database health check'
      );
      checks.database = {
        status: 'connected',
        latency: Date.now() - dbStart,
      };
    } catch (error) {
      console.error('[Health Check] Database connection failed:', error);
      checks.database = {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Database connection failed',
        latency: Date.now() - dbStart,
      };
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();

    // Overall status
    const allOk = Object.values(checks).every(check => check.status === 'ok' || check.status === 'connected');
    const totalLatency = Date.now() - startTime;

    const response = {
      status: allOk ? 'healthy' : 'unhealthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latency: totalLatency,
      environment: process.env.NODE_ENV || 'development',
      checks,
      // Minimal system info for production
      ...(process.env.NODE_ENV === 'development' && {
        system: {
          node: process.version,
          platform: process.platform,
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          },
        },
      }),
    };

    return NextResponse.json(response, {
      status: allOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Check': 'true',
      },
    });
  }, 'Health Check');
}
