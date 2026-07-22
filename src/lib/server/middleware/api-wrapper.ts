import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type ApiHandler<T = unknown> = (request: Request | NextRequest) => Promise<T>;

// Minimal compatibility layer for older API routes.
// Prefer writing handlers that directly return NextResponse in new code.
export function withApiHandler(handler: (request: Request | NextRequest) => Promise<NextResponse>) {
  return async (request: Request | NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      
      // Handle authentication errors properly
      if (message === 'Unauthorized') {
        return NextResponse.json({ success: false, message }, { status: 401 });
      }
      
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  };
}

// Compatibility export; some routes import it but don't actually use it.
export const ApiWrapper = {
  json: (data: unknown, status: number = 200) => NextResponse.json(data, { status }),
};

