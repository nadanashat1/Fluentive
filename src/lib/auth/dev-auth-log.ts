import type { NextRequest } from "next/server";

const enabled =
  process.env.NODE_ENV === "development" ||
  process.env.AUTH_DEBUG === "1";

export type AuthRejectionReason =
  | "MISSING_ACCESS_TOKEN"
  | "INVALID_TOKEN_PAYLOAD"
  | "INVALID_USER"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "JWT_SECRET_MISSING";

export function logAuthResolution(
  request: NextRequest,
  payload: {
    route: string;
    hasAccessCookie: boolean;
    hasRefreshCookie: boolean;
    hasBearer: boolean;
    resolved: boolean;
    rejection?: AuthRejectionReason | string;
    userId?: string;
  }
): void {
  if (!enabled) return;

  const entry = {
    level: "DEBUG",
    service: "auth",
    message: payload.resolved ? "session_resolved" : "session_rejected",
    route: payload.route,
    hasAccessCookie: payload.hasAccessCookie,
    hasRefreshCookie: payload.hasRefreshCookie,
    hasBearer: payload.hasBearer,
    resolved: payload.resolved,
    rejection: payload.rejection,
    userId: payload.userId,
  };

  console.log(JSON.stringify(entry));
}
