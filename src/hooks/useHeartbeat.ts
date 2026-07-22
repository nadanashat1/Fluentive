import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export function useHeartbeat() {
  const initializedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const [isIdle, setIsIdleState] = useState(false);
  const isIdleRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateIdle = (val: boolean) => {
    setIsIdleState(val);
    isIdleRef.current = val;
  };

  useEffect(() => {
    // Idle Detection Logic
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const resetIdleTimer = () => {
      if (isIdleRef.current) {
        updateIdle(false);
      }
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      
      idleTimerRef.current = setTimeout(() => {
        updateIdle(true);
      }, IDLE_TIMEOUT);
    };

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const interval = setInterval(async () => {
      if (isFetchingRef.current) return;
      
      // Check if work mode is enabled
      const workMode = localStorage.getItem('work_mode_enabled');
      if (workMode !== 'true') return;

      isFetchingRef.current = true;
      
      try {
        await apiFetch("/api/time-tracking/heartbeat", {
          method: "POST",
          body: JSON.stringify({ isIdle: isIdleRef.current })
        });
      } catch (e) {
        console.log("[Heartbeat] failed:", e);
      } finally {
        isFetchingRef.current = false;
      }
    }, 60000);

    // Initial heartbeat
    const initialHeartbeat = async () => {
      const workMode = localStorage.getItem('work_mode_enabled');
      if (workMode !== 'true') return;

      try {
        await apiFetch("/api/time-tracking/heartbeat", {
          method: "POST",
          body: JSON.stringify({ isIdle: false })
        });
      } catch (e) {}
    };
    initialHeartbeat();

    return () => clearInterval(interval);
  }, []);
}
