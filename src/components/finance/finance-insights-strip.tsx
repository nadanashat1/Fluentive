"use client";

import type { ComponentType } from "react";
import { Sparkles, AlertTriangle, TrendingUp, Info, CheckCircle2 } from "lucide-react";
import type { FinanceInsight } from "@/lib/finance/types";

const TYPE_STYLES: Record<
  FinanceInsight["type"],
  { border: string; bg: string; icon: ComponentType<{ size?: number; className?: string }> }
> = {
  success: {
    border: "border-green-200 dark:border-green-900/40",
    bg: "bg-green-50/80 dark:bg-green-900/10",
    icon: CheckCircle2,
  },
  warning: {
    border: "border-amber-200 dark:border-amber-900/40",
    bg: "bg-amber-50/80 dark:bg-amber-900/10",
    icon: AlertTriangle,
  },
  danger: {
    border: "border-red-200 dark:border-red-900/40",
    bg: "bg-red-50/80 dark:bg-red-900/10",
    icon: AlertTriangle,
  },
  info: {
    border: "border-blue-200 dark:border-blue-900/40",
    bg: "bg-blue-50/80 dark:bg-blue-900/10",
    icon: Info,
  },
};

interface FinanceInsightsStripProps {
  insights: FinanceInsight[];
  isLoading?: boolean;
}

export function FinanceInsightsStrip({ insights, isLoading }: FinanceInsightsStripProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 min-w-[240px] flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/40"
          />
        ))}
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-bold text-[#2f3440] dark:text-gray-100">
          Financial intelligence
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {insights.map((insight) => {
          const style = TYPE_STYLES[insight.type];
          const Icon = style.icon;
          return (
            <div
              key={insight.id}
              className={`min-w-[260px] max-w-[320px] shrink-0 rounded-xl border p-4 ${style.border} ${style.bg}`}
            >
              <div className="flex items-start gap-2">
                <Icon size={18} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-[13px] font-bold text-[#2f3440] dark:text-gray-100">
                    {insight.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#707483] dark:text-gray-400">
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="hidden min-w-[200px] shrink-0 items-center rounded-xl border border-dashed border-brand/30 bg-brand/5 p-4 lg:flex">
          <TrendingUp className="mr-2 h-5 w-5 text-brand" />
          <p className="text-[12px] text-[#707483] dark:text-gray-400">
            Insights update as your invoice and expense data changes.
          </p>
        </div>
      </div>
    </section>
  );
}
