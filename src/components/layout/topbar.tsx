"use client";

import { Menu, Moon, Search, Sun, User } from "lucide-react";
import { UniversalSearch } from "@/components/ui/universal-search";
import NotificationBell from "@/components/notifications/notification-bell";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { useTheme } from "@/contexts/theme-context";
import { useUser } from "@/contexts/user-context";
import { TimeTrackingWidget } from "@/components/dashboard/time-tracking-widget";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useUser();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#ececef] bg-white px-4 md:px-6 dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-[#646b7a] transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#1a0b2e] md:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <WorkspaceSwitcher />
      </div>

      <div className="flex-1 max-w-md hidden lg:flex items-center gap-4 mx-8">
        <UniversalSearch />
        <TimeTrackingWidget />
      </div>

      <div className="ml-4 flex items-center gap-3">
        {!loading && user && <NotificationBell userId={user.id} />}

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[#646b7a] transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#1a0b2e]"
          aria-label="Toggle dark mode"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {!loading && user && (
          <div className="hidden items-center gap-2.5 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <p className="text-[13px] font-semibold text-[#2f3440] dark:text-gray-300">{user.name}</p>
          </div>
        )}
      </div>
    </header>
  );
}
