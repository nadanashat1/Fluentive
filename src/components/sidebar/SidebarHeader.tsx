"use client";

import { memo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
import clsx from "clsx";
import { sidebarMotion } from "./sidebar.motion";
import { motion } from "framer-motion";

interface SidebarHeaderProps {
  collapsed: boolean;
  isOnline: boolean;
  notificationCount: number;
  onToggleCollapse: () => void;
  onRefreshNotifications: () => Promise<void>;
}

export const SidebarHeader = memo(function SidebarHeader({
  collapsed,
  isOnline,
  notificationCount,
  onToggleCollapse,
  onRefreshNotifications,
}: SidebarHeaderProps) {
  // Refresh notifications on mount
  useEffect(() => {
    onRefreshNotifications();
    const interval = setInterval(onRefreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [onRefreshNotifications]);

  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-[#ececef] dark:border-[#2a2f3a] px-4 shrink-0">
      {/* Logo with online indicator */}
      <motion.div 
        className="relative grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-white"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        D
        {/* Online status dot with pulse animation */}
        <span 
          className={clsx(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#1a0b2e]",
            isOnline ? "bg-emerald-500" : "bg-amber-500"
          )} 
        />
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
        )}
      </motion.div>

      {/* App name + status */}
      {!collapsed && (
        <motion.div 
          className="flex-1 min-w-0"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-[15px] font-semibold text-[#2f3440] dark:text-gray-200 truncate">
            D Fluency Flow
          </p>
          <p className="text-[10px] text-[#8f93a1] dark:text-gray-500">
            {isOnline ? "Online" : "Offline"}
          </p>
        </motion.div>
      )}

      {/* Notification bell with badge */}
      {!collapsed && notificationCount > 0 && (
        <motion.div 
          className="relative flex items-center justify-center h-8 w-8 rounded-full bg-brand/10 dark:bg-brand/20 cursor-pointer hover:bg-brand/20 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Bell size={14} className="text-brand" />
          <motion.span 
            className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-[#f25572] text-[10px] font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </motion.span>
        </motion.div>
      )}

      {/* Collapse toggle */}
      <motion.button
        onClick={onToggleCollapse}
        className={clsx(
          "ml-auto rounded-lg p-1.5",
          sidebarMotion.button,
          "hover:bg-[#f6f6f8] dark:hover:bg-[#1a0b2e]",
          "text-[#707483] dark:text-gray-400"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </motion.button>
    </div>
  );
});
