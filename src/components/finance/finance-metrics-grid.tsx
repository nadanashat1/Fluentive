"use client";

import { FinanceMetricCard } from "./finance-metric-card";
import type { FinanceMetric } from "@/lib/finance/types";

interface FinanceMetricsGridProps {
  metrics: FinanceMetric[];
  isLoading?: boolean;
}

export function FinanceMetricsGrid({ metrics, isLoading }: FinanceMetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-[110px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {metrics.map((metric) => (
        <FinanceMetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
