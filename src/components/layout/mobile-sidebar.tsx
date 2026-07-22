"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { sideAdminNav, sideMainNav } from "@/data/nav-config";
import { Building2, LayoutDashboard, Users, Settings, LogOut, Activity, X } from "lucide-react";
import clsx from "clsx";
import { apiFetch } from "@/lib/api-client";
import { useUser } from "@/contexts/user-context";
import { userCanManageUsers } from "@/lib/ui-user-utils";
import { useEffect } from "react";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={16} />,
  Leads: <Users size={16} />,
  "Sales Pipeline": <Users size={16} />,
  Courses: <Building2 size={16} />,
  Instructors: <Users size={16} />,
  "Sales Team": <Users size={16} />,
  Marketing: <Users size={16} />,
  HR: <Users size={16} />,
  Finance: <Building2 size={16} />,
  Settings: <Settings size={16} />,
  "Activity Logs": <Activity size={16} />,
  Users: <Users size={16} />
};

function MobileItem({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  const pathname = usePathname();
  const active = href !== "#" && pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClose}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-brand/10 text-brand"
          : "text-[#707483] hover:bg-[#f6f6f8] dark:text-gray-400 dark:hover:bg-[#1a0b2e]"
      )}
    >
      <span className="opacity-85">{iconMap[label]}</span>
      <span>{label}</span>
    </Link>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

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

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#fafafd] dark:bg-[#0f0820] shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-[#ececef] dark:border-[#2a2f3a] px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
              D
            </div>
            <p className="text-[15px] font-semibold text-[#2f3440] dark:text-gray-200">D Fluency Flow</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#707483] hover:bg-[#f0f1f3] dark:text-gray-400 dark:hover:bg-[#1a0b2e]"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div className="space-y-1">
            {sideMainNav.map((item) => (
              <MobileItem key={item.label} href={item.href} label={item.label} onClose={onClose} />
            ))}
          </div>

          {user?.role === "admin" && (
            <>
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#a7a9b3] dark:text-gray-500">
                Administration
              </div>

              <div className="space-y-1">
                {sideAdminNav.map((item) => (
                  <MobileItem key={item.label} href={item.href} label={item.label} onClose={onClose} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#ececef] dark:border-[#2a2f3a] p-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-white dark:bg-[#1a0b2e] border border-[#e6e7eb] dark:border-[#2a2f3a] p-3">
            <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#2f3440] dark:text-gray-200">
                {user?.name || "Getting things ready..."}
              </p>
              <p className="truncate text-[11px] text-[#8f93a1] dark:text-gray-500">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e6e7eb] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] px-3 py-2.5 text-[13px] font-medium text-[#707483] dark:text-gray-400 transition hover:bg-[#f6f6f8] dark:hover:bg-[#250f40]"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
