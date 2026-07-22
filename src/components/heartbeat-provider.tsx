"use client";

import { useHeartbeat } from "@/hooks/useHeartbeat";

/**
 * Heartbeat Provider Component
 * Wraps the app to enable automatic heartbeat tracking
 * This should be placed inside the UserProvider
 */
export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  useHeartbeat();
  return <>{children}</>;
}
