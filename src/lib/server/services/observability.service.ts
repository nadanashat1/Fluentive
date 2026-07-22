import { prisma } from '@/lib/prisma';

/**
 * ENTERPRISE OBSERVABILITY SERVICE
 * Tracks performance metrics, error rates, and system health.
 */

export const trackMetric = async (data: {
  organizationId?: string;
  type: 'API_LATENCY' | 'DB_QUERY' | 'AUTH_FAILURE' | 'ERROR_RATE' | 'USAGE';
  value: number;
  meta?: any;
}) => {
  try {
    // Log to UsageMetric or a specialized Metric model
    await prisma.usageMetric.create({
      data: {
        organizationId: data.organizationId || 'SYSTEM',
        type: data.type,
        value: data.value,
        date: new Date()
      }
    });
  } catch (err) {
    console.error('[Observability] Failed to track metric:', err);
  }
};

export const getSystemHealth = async () => {
  // Check DB connection
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatency = Date.now() - start;

  // Aggregate recent errors
  const errorCount = await prisma.securityLog.count({
    where: {
      action: { contains: 'ERROR' },
      createdAt: { gte: new Date(Date.now() - 3600000) } // Last hour
    }
  });

  return {
    status: errorCount > 10 ? 'DEGRADED' : 'HEALTHY',
    dbLatency,
    errorCountLastHour: errorCount,
    uptime: process.uptime()
  };
};
