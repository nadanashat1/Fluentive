"use client";

import { useEffect } from "react";
import { uiEngine } from "@/core/uiEngine";
import { eventBus } from "@/core/eventBus";

/**
 * System Provider
 * 
 * Initializes the UI Engine and event bus.
 * Note: WebSocket removed - using polling for Vercel compatibility
 */
export function SystemProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  useEffect(() => {
    // Initialize UI Engine
    uiEngine.init();

    // Cleanup on unmount
    return () => {
      eventBus.clear();
    };
  }, [userId]);

  return <>{children}</>;
}
