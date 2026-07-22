"use client";

import { memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { sideAdminNav, sideMainNav } from "@/data/nav-config";
import { SidebarItem } from "./SidebarItem";

interface NavGroup {
  label: string;
  items: typeof sideMainNav;
  requiresAdmin?: boolean;
}

interface SidebarNavProps {
  collapsed: boolean;
  isTransitioning: boolean;
  isNavigating: boolean;
  indicatorY: number;
  onIndicatorChange: (y: number) => void;
  onNavigationStart: () => void;
  userRole?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
} as const;

export const SidebarNav = memo(function SidebarNav({
  collapsed,
  isTransitioning,
  isNavigating,
  indicatorY,
  onIndicatorChange,
  onNavigationStart,
  userRole,
  containerRef,
}: SidebarNavProps) {
  const pathname = usePathname();

  // Config-driven navigation groups
  const navGroups: NavGroup[] = useMemo(() => [
    { label: "Main", items: sideMainNav },
    { label: "Administration", items: sideAdminNav, requiresAdmin: true },
  ], []);

  // Check if item is active using pathname matching
  const isItemActive = useCallback((href: string) => {
    // Exact match or starts with (for nested routes)
    return pathname === href || pathname.startsWith(`${href}/`);
  }, [pathname]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-5 px-0 py-4 relative"
    >
      {/* Floating active indicator */}
      {!collapsed && (
        <motion.div
          className="absolute left-0 w-[3px] rounded-full bg-brand shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          animate={{ y: indicatorY }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          style={{ height: 36, top: 8 }}
        />
      )}

      {/* Navigation groups */}
      {navGroups.map((group, groupIndex) => {
        // Skip admin-only groups for non-admin users
        if (group.requiresAdmin && userRole !== "admin") {
          return null;
        }

        return (
          <div key={group.label} className="space-y-1">
            {/* Group label (only when expanded) */}
            {!collapsed && (
              <motion.div 
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#a7a9b3] dark:text-gray-500"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                {group.label}
              </motion.div>
            )}

            {/* Group items */}
            <motion.div
              className="space-y-0.5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {group.items.map((item, itemIndex) => {
                const isActive = isItemActive(item.href);
                const globalIndex = groupIndex * 100 + itemIndex;

                return (
                  <SidebarItem
                    key={item.label}
                    href={item.href}
                    label={item.label}
                    collapsed={collapsed}
                    onActive={() => {}}
                    isTransitioning={isTransitioning}
                    isNavigating={isNavigating}
                    index={globalIndex}
                    mouseY={0}
                    direction={0}
                  />
                );
              })}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
});
