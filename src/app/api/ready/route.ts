import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEnv } from "@/lib/server/env-validator";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

// 3-second timeout wrapper helper
async function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Readiness check timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export async function GET() {
  try {
    // 1. Validate environment variables
    const envValidation = validateEnv();
    if (!envValidation.valid) {
      logger.warn('readiness', 'Readiness check failed: environment invalid', { errors: envValidation.errors });
      return NextResponse.json({
        status: "not ready",
        reason: "Environment configuration invalid",
        errors: envValidation.errors,
        timestamp: new Date().toISOString(),
      }, {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 2. Verify Database connectivity via query timeout of 3s
    await withTimeout(
      prisma.$queryRaw`SELECT 1`,
      3000
    );

    return NextResponse.json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Database connection failed";
    logger.error('readiness', `Readiness probe failed: ${errMsg}`, error instanceof Error ? error : undefined);

    return NextResponse.json({
      status: "not ready",
      database: "disconnected",
      error: errMsg,
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
