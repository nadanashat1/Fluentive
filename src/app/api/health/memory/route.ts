import { NextRequest, NextResponse } from 'next/server';
import { memoryMonitor } from '@/lib/server/memory-monitor';

/**
 * Memory health check endpoint
 * Returns current memory status and alerts
 */
export async function GET(request: NextRequest) {
  try {
    const health = memoryMonitor.getHealthStatus();
    
    // Determine HTTP status based on memory health
    let statusCode = 200;
    if (health.status === 'emergency') statusCode = 503;
    else if (health.status === 'critical') statusCode = 503;
    else if (health.status === 'warning') statusCode = 200;

    return NextResponse.json({
      success: true,
      data: {
        status: health.status,
        memory: health.stats,
        alerts: health.alerts,
        recommendations: health.recommendations,
        vercelLimits: {
          hobbyPlan: '2048MB',
          currentUsage: health.stats ? `${health.stats.heapUsed}MB` : 'Unknown',
          usagePercent: health.stats ? health.stats.usagePercent : 0,
          isWithinLimits: (health.stats?.usagePercent || 0) < 90
        }
      }
    }, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Memory health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
