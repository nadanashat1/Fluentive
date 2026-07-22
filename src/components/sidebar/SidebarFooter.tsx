"use client";

import { memo } from "react";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { sidebarMotion } from "./sidebar.motion";
import { useUser } from "@/contexts/user-context";
import { userCanManageUsers, userCanViewAnalytics } from "@/lib/ui-user-utils";

interface SidebarFooterProps {
  collapsed: boolean;
  isOnline: boolean;
  isNavigating: boolean;
  onLogout: () => Promise<void>;
  onNavigationStart: () => void;
}

export const SidebarFooter = memo(function SidebarFooter({
  collapsed,
  isOnline,
  isNavigating,
  onLogout,
  onNavigationStart,
}: SidebarFooterProps) {
  const { user, loading } = useUser();

  const roleLabel = userCanManageUsers(user) 
    ? "Administrator" 
    : user?.role || "User";

  const handleLogout = async () => {
    onNavigationStart();
    await onLogout();
  };

  return (
    <div className="border-t border-[#ececef] dark:border-[#2a2f3a] p-3 space-y-2 shrink-0">
      {/* User card */}
      <motion.div 
        className={clsx(
          "flex items-center rounded-lg border border-[#e6e7eb] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-2.5",
          collapsed ? "justify-center" : "gap-3"
        )}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {/* Avatar with activity indicator */}
        <div className="relative grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white">
          {loading ? "..." : user?.name?.charAt(0)?.toUpperCase() || "?"}
          {!loading && isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1a0b2e]" />
          )}
        </div>

        {/* User info */}
        {!collapsed && (
          <motion.div 
            className="min-w-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="truncate text-[13px] font-semibold text-[#2f3440] dark:text-gray-200">
              {loading ? "Getting things ready..." : user?.name || "Unknown user"}
            </p>
            <p className="truncate text-[11px] text-[#8f93a1] dark:text-gray-500">
              {loading ? "..." : roleLabel}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Logout button */}
      <motion.button
        onClick={handleLogout}
        disabled={isNavigating}
        className={clsx(
          "flex items-center justify-center rounded-lg border border-[#e6e7eb] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e]",
          "px-3 py-2 text-[13px] font-medium text-[#707483] dark:text-gray-400",
          sidebarMotion.button,
          "hover:bg-[#f6f6f8] dark:hover:bg-[#250f40]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          collapsed ? "w-full" : "w-full gap-2"
        )}
        whileHover={{ scale: isNavigating ? 1 : 1.02 }}
        whileTap={{ scale: isNavigating ? 1 : 0.98 }}
      >
        <LogOut size={15} />
        {!collapsed && <span>Logout</span>}
      </motion.button>
    </div>
  );
});
