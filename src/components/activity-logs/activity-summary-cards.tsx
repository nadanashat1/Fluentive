"use client";

import {
  Activity,
  AlertTriangle,
  Briefcase,
  Bot,
  Download,
  User,
  ShieldAlert,
} from "lucide-react";
import type { ActivityDashboardSummary } from "@/lib/activity-logs/summaries";

interface ActivitySummaryCardsProps {
  summary: ActivityDashboardSummary;
}

export function ActivitySummaryCards({ summary }: ActivitySummaryCardsProps) {
  const cards = [
    {
      label: "User actions today",
      value: summary.actionsToday,
      icon: Activity,
      tone: "text-[#840A36]",
      bg: "bg-[#fdf2f6] dark:bg-[#2a1020]",
    },
    {
      label: "Warnings detected",
      value: summary.warningsDetected,
      icon: AlertTriangle,
      tone: summary.warningsDetected > 0 ? "text-amber-700" : "text-slate-500",
      bg: summary.warningsDetected > 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-[#f8f9fa] dark:bg-[#0f0820]",
    },
    {
      label: "Deals created this week",
      value: summary.dealsThisWeek,
      icon: Briefcase,
      tone: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Failed sign-in attempts",
      value: summary.failedLogins,
      icon: ShieldAlert,
      tone: summary.failedLogins > 0 ? "text-red-700" : "text-slate-500",
      bg: summary.failedLogins > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-[#f8f9fa] dark:bg-[#0f0820]",
    },
    {
      label: "AI errors",
      value: summary.aiErrors,
      icon: Bot,
      tone: summary.aiErrors > 0 ? "text-fuchsia-700" : "text-slate-500",
      bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    },
    {
      label: summary.mostActiveUser ? "Most active user" : "Team activity",
      value: summary.mostActiveUser
        ? summary.mostActiveUser.split(/\s+/)[0]
        : "—",
      sub: summary.mostActiveUser ? `${summary.mostActiveUserCount} actions` : undefined,
      icon: User,
      tone: "text-sky-700 dark:text-sky-300",
      bg: "bg-sky-50 dark:bg-sky-950/30",
    },
    {
      label: "Exports this week",
      value: summary.exportsThisWeek,
      icon: Download,
      tone: "text-amber-700",
      bg: "bg-amber-50/80 dark:bg-amber-950/20",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] p-3 ${card.bg}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#8b8f9b] dark:text-gray-400 leading-tight">
                  {card.label}
                </p>
                <p className={`mt-1 text-xl font-bold truncate ${card.tone}`}>
                  {card.value}
                </p>
                {"sub" in card && card.sub && (
                  <p className="text-[11px] text-[#8b8f9b]">{card.sub}</p>
                )}
              </div>
              <Icon size={18} className={`shrink-0 ${card.tone} opacity-80`} aria-hidden />
            </div>
          </div>
        );
      })}
    </div>
  );
}
