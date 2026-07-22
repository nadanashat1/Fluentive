import { NextResponse } from "next/server";
import { assertEnv } from "@/lib/server/env-validator";

export const dynamic = "force-dynamic";

/**
 * Liveness Probe — /api/live
 *
 * Contract (non-negotiable):
 * MUST:  Return process responsiveness proof only.
 * MUST NEVER: Query the database, connect to Redis, call any external provider,
 *             or depend on any service outside the current process boundary.
 *
 * If this endpoint fails, the runtime will restart the container/instance.
 * It must be structurally incapable of failing due to infrastructure conditions.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
