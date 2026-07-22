"use client";

import { Activity, Users, Clock, Target, HeartPulse } from "lucide-react";
import type { OperationalMetrics } from "@/lib/finance/types";
import { formatCurrency, formatPercent } from "@/lib/finance/formatters";
import { FinanceChartContainer } from "./finance-chart-container";

interface FinanceOperationalMetricsProps {
  metrics: OperationalMetrics;
  isLoading?: boolean;
}

export function FinanceOperationalMetrics({
  metrics,
  isLoading,
}: FinanceOperationalMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/40" />
        ))}
      </div>
    );
  }

  const healthColor =
    metrics.financialHealthScore >= 75
      ? "text-green-600 dark:text-green-400"
      : metrics.financialHealthScore >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-[#2f3440] dark:text-gray-100">Operational metrics</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FinanceChartContainer title="Recurring revenue" subtitle="MRR & ARR">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-500">MRR</p>
              <p className="mt-1 text-xl font-bold text-[#2f3440] dark:text-gray-100">
                {formatCurrency(metrics.mrr)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-500">ARR</p>
              <p className="mt-1 text-xl font-bold text-brand">{formatCurrency(metrics.arr)}</p>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[12px] text-gray-500">
            <Activity size={14} />
            Churn impact estimate: {formatPercent(metrics.churnImpact, 1)}
          </p>
        </FinanceChartContainer>

        <FinanceChartContainer title="Collections" subtitle="Conversion & delays">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                <Target size={14} />
                Invoice conversion
              </span>
              <span className="font-bold text-brand">
                {formatPercent(metrics.invoiceConversionRate, 1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                <Clock size={14} />
                Avg payment delay
              </span>
              <span className="font-semibold">
                {metrics.avgPaymentDelayDays.toFixed(0)} days
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
              <span className="text-[12px] text-gray-600 dark:text-gray-400">Unpaid revenue</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(metrics.unpaidRevenue)}
              </span>
            </div>
          </div>
        </FinanceChartContainer>

        <FinanceChartContainer title="Financial health" subtitle="Composite score">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-current ${healthColor}`}
            >
              <span className={`text-2xl font-bold ${healthColor}`}>
                {metrics.financialHealthScore}
              </span>
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-[#2f3440] dark:text-gray-100">
                <HeartPulse size={16} className={healthColor} />
                Health score
              </p>
              <p className="mt-1 text-[12px] text-gray-500">
                Based on margin, collections, and growth trends.
              </p>
            </div>
          </div>
        </FinanceChartContainer>

        <FinanceChartContainer
          title="Top paying customers"
          subtitle="By paid invoice volume"
          className="md:col-span-2 xl:col-span-3"
        >
          {metrics.topPayingCustomers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No paid invoices yet.</p>
          ) : (
            <ul className="space-y-3">
              {metrics.topPayingCustomers.map((c, i) => {
                const max = metrics.topPayingCustomers[0]?.total ?? 1;
                const width = (c.total / max) * 100;
                return (
                  <li key={c.name}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="flex items-center gap-2 font-medium">
                        <Users size={14} className="text-brand" />
                        {i + 1}. {c.name}
                      </span>
                      <span className="font-bold">{formatCurrency(c.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </FinanceChartContainer>
      </div>
    </section>
  );
}
