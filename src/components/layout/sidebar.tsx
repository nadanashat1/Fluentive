"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { sideAdminNav, sideMainNav } from "@/data/nav-config";
import { LogOut, ChevronLeft, ChevronRight, Command as CommandIcon } from "lucide-react";
import clsx from "clsx";
import { apiFetch } from "@/lib/api-client";
import { useUser } from "@/contexts/user-context";
import { userCanManageUsers, userCanViewAnalytics } from "@/lib/ui-user-utils";
import { motion as framerMotion } from "framer-motion";
import { motion } from "@/lib/motion-config";
import { useEffect, useRef, useState } from "react";
import { SidebarItem } from "@/components/sidebar/SidebarItem";
import { sidebarMotion } from "@/components/sidebar/sidebar.motion";
import { getSidebarWidth } from "@/components/sidebar/sidebar.utils";

export function Sidebar() {
  const router = useRouter();
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [indicatorY, setIndicatorY] = useState(0);
  const [prevPath, setPrevPath] = useState(pathname);
  const [mouseY, setMouseY] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);

  // Smart hover prediction - only track mouse when inside sidebar nav area
  const handleNavMouseMove = (e: React.MouseEvent) => {
    const diff = e.clientY - lastY.current;
    setDirection(diff);
    lastY.current = e.clientY;
    setMouseY(e.clientY);
  };

  const handleNavMouseLeave = () => {
    setDirection(0);
    setMouseY(0);
  };

  // Route transition sync
  useEffect(() => {
    setPrevPath(pathname);
  }, [pathname]);

  const isTransitioning = prevPath !== pathname;

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

  // Navigation momentum
  const handleNavigationStart = () => {
    setIsNavigating(true);
    setTimeout(() => setIsNavigating(false), 300);
  };

  // Scroll-aware active highlight
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section]");
      let current = "";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120) {
          current = section.id;
        }
      });

      // Sync highlight based on scroll position
      if (current) {
        const activeItem = document.querySelector(`[href="/${current}"]`) as HTMLElement;
        if (activeItem && containerRef.current) {
          const itemTop = activeItem.offsetTop;
          setIndicatorY(itemTop);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch<{ success: true }>("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
      router.push("/login");
    }
  };

  const roleLabel = userCanManageUsers(user) ? "Administrator" : user?.role || "User";

  const sidebarWidth = getSidebarWidth(collapsed);

  return (
    <aside className={sidebarWidth.className}>
      {/* UI energy layer - global motion atmosphere */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-24 left-10 h-48 w-48 animate-pulse rounded-full bg-brand blur-3xl" />
        <div className="absolute bottom-10 right-10 h-48 w-48 animate-pulse rounded-full bg-purple-500 blur-3xl" />
      </div>
      {/* Logo header */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[#ececef] dark:border-[#2a2f3a] px-4">
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
          D
        </div>
        {!collapsed && (
          <p className="text-[15px] font-semibold text-[#2f3440] dark:text-gray-200">D Fluency Flow</p>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "ml-auto rounded-lg p-1.5",
            sidebarMotion.button,
            "hover:bg-[#f6f6f8] dark:hover:bg-[#1a0b2e]",
            "text-[#707483] dark:text-gray-400"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto space-y-5 px-0 py-4 relative"
        onMouseMove={handleNavMouseMove}
        onMouseLeave={handleNavMouseLeave}
      >
        {/* floating active indicator */}
        {!collapsed && (
          <framerMotion.div
            className="absolute left-0 w-[3px] rounded-full bg-brand"
            animate={{ y: indicatorY }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ height: 36 }}
          />
        )}

        <div className="space-y-0.5">
          {sideMainNav.map((item, index) => (
            <SidebarItem 
              key={item.label} 
              href={item.href} 
              label={item.label} 
              collapsed={collapsed} 
              onActive={setIndicatorY} 
              isTransitioning={isTransitioning} 
              mouseY={mouseY}
              index={index}
              isNavigating={isNavigating}
              direction={direction}
            />
          ))}
        </div>

        {userCanManageUsers(user) && !collapsed && (
          <div className="px-4 text-[11px] font-semibold uppercase tracking-wider text-[#a7a9b3] dark:text-gray-500 transition-all duration-200">
            Administration
          </div>
        )}

        {userCanManageUsers(user) && (
          <div className="space-y-0.5">
            {sideAdminNav.map((item, index) => (
              <SidebarItem 
                key={item.label} 
                href={item.href} 
                label={item.label} 
                collapsed={collapsed} 
                onActive={setIndicatorY} 
                isTransitioning={isTransitioning} 
                mouseY={mouseY}
                index={sideMainNav.length + index}
                isNavigating={isNavigating}
                direction={direction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cmd+K Hint - subtle discoverability */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-[#ececef] dark:border-[#2a2f3a]">
          <div className="flex items-center justify-between text-[11px] text-[#a7a9b3] dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <CommandIcon size={12} />
              Command Palette
            </span>
            <kbd className="rounded bg-[#f6f6f8] dark:bg-[#2a2f3a] px-1.5 py-0.5">⌘K</kbd>
          </div>
        </div>
      )}

      {/* User card + Logout */}
      <div className="border-t border-[#ececef] dark:border-[#2a2f3a] m-0 p-3 space-y-2">
        <div className={clsx(
          "flex items-center rounded-lg border border-[#e6e7eb] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-2.5",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white">
            {loading ? "..." : user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#2f3440] dark:text-gray-200">
                {loading ? "Getting things ready..." : user?.name || "Unknown user"}
              </p>
              <p className="truncate text-[11px] text-[#8f93a1] dark:text-gray-500">
                {loading ? "..." : roleLabel}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            handleNavigationStart();
            handleLogout();
          }}
          className={clsx(
            "flex items-center justify-center rounded-lg border border-[#e6e7eb] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e]",
            "px-3 py-2 text-[13px] font-medium text-[#707483] dark:text-gray-400",
            sidebarMotion.button,
            "hover:bg-[#f6f6f8] dark:hover:bg-[#250f40]",
            collapsed ? "w-full" : "w-full gap-2"
          )}
        >
          <LogOut size={15} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
