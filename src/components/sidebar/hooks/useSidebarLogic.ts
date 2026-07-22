"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useUser } from "@/contexts/user-context";

interface SidebarLogicReturn {
  // State
  collapsed: boolean;
  notificationCount: number;
  isOnline: boolean;
  isNavigating: boolean;
  
  // Actions
  setCollapsed: (value: boolean) => void;
  handleNavigationStart: () => void;
  handleLogout: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useSidebarLogic(): SidebarLogicReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();
  
  const [collapsed, setCollapsed] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation momentum with cleanup
  const handleNavigationStart = useCallback(() => {
    setIsNavigating(true);
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  }, []);

  // Safe logout
  const handleLogout = useCallback(async () => {
    handleNavigationStart();
    try {
      await apiFetch<{ success: true }>("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // Silent fail - redirect anyway
    } finally {
      router.push("/login");
    }
  }, [router, handleNavigationStart]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch<{ success: true; data: any[] }>("/api/notifications");
      if (res.data) {
        const unread = res.data.filter((n: any) => !n.isRead).length;
        setNotificationCount(unread);
      }
    } catch {
      // Silently fail
    }
  }, [user]);

  // Smart focus memory - remember last route
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastRoute", pathname);
    }
  }, [pathname]);

  // Navigation flow memory - usage tracking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const usage = JSON.parse(localStorage.getItem("nav-usage") || "{}");
      usage[pathname] = (usage[pathname] || 0) + 1;
      localStorage.setItem("nav-usage", JSON.stringify(usage));
    }
  }, [pathname]);

  // Online status indicator
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return {
    collapsed,
    notificationCount,
    isOnline,
    isNavigating,
    setCollapsed,
    handleNavigationStart,
    handleLogout,
    refreshNotifications,
  };
}
