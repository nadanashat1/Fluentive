"use client";

import type { ComponentType } from "react";
import {
  CreditCard,
  FileText,
  RefreshCw,
  AlertCircle,
  Download,
  RotateCcw,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/finance/types";
import { formatCurrency, formatDate } from "@/lib/finance/formatters";
import { FinanceChartContainer } from "./finance-chart-container";

const EVENT_ICONS: Record<TimelineEvent["type"], ComponentType<{ size?: number; className?: string }>> = {
  payment: CreditCard,
  invoice: FileText,
  refund: RotateCcw,
  renewal: RefreshCw,
  failed: AlertCircle,
  export: Download,
};

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  payment: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  invoice: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  refund: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  renewal: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  failed: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  export: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

interface FinanceTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export function FinanceTimeline({ events, isLoading }: FinanceTimelineProps) {
  return (
    <FinanceChartContainer title="Transaction timeline" subtitle="Payments, invoices, and activity">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/40" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No transactions yet. Activity will appear as invoices are created and paid.
        </p>
      ) : (
        <ul className="max-h-[420px] space-y-0 overflow-y-auto pr-1 scrollbar-thin">
          {events.map((event, idx) => {
            const Icon = EVENT_ICONS[event.type];
            const color = EVENT_COLORS[event.type];
            return (
              <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
                {idx < events.length - 1 && (
                  <span
                    className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-gray-200 dark:bg-gray-700"
                    aria-hidden
                  />
                )}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}
                >
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#2f3440] dark:text-gray-100">
                      {event.title}
                    </p>
                    {event.amount !== undefined && (
                      <span className="text-[12px] font-bold text-brand">
                        {formatCurrency(event.amount)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-[#707483] dark:text-gray-400">
                    {event.description}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">{formatDate(event.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </FinanceChartContainer>
  );
}
