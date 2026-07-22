"use client";

import type { ComponentType } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Wallet,
  PieChart,
  ArrowUpRight,
  RefreshCw,
  CreditCard,
  BarChart3,
  LineChart,
  AlertTriangle,
} from "lucide-react";
import type { FinanceMetric } from "@/lib/finance/types";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { FINANCE_CHART_COLORS } from "@/lib/finance/constants";
import { formatPercent } from "@/lib/finance/formatters";

const ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  "total-revenue": DollarSign,
  "monthly-revenue": BarChart3,
  outstanding: FileText,
  "paid-invoices": CreditCard,
  "profit-margin": PieChart,
  expenses: Wallet,
  "cash-flow": LineChart,
  "revenue-growth": ArrowUpRight,
  "avg-deal": DollarSign,
  forecast: TrendingUp,
  subscription: RefreshCw,
  refunds: AlertTriangle,
};

interface FinanceMetricCardProps {
  metric: FinanceMetric;
}

export function FinanceMetricCard({ metric }: FinanceMetricCardProps) {
  const Icon = ICON_MAP[metric.id] ?? DollarSign;
  const positive = metric.trendPositive ?? (metric.trendPercent ?? 0) >= 0;
  const sparkData = (metric.sparkline ?? []).map((v, i) => ({ i, v }));

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#ececef] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(18,20,31,0.05)] transition hover:border-brand/20 dark:border-[#2a2f3a] dark:bg-[#0b0614] dark:hover:border-brand/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Icon size={16} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:text-gray-500">
            {metric.title}
          </p>
        </div>
        {(metric.trendPercent !== undefined || metric.trendLabel) && (
          <div
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              positive
                ? "bg-[#f2fbf6] text-[#1d8a51] dark:bg-green-900/20 dark:text-green-300"
                : "bg-[#fff1f1] text-[#d64040] dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>
              {metric.trendPercent !== undefined
                ? formatPercent(metric.trendPercent, 1)
                : metric.trendLabel}
            </span>
          </div>
        )}
      </div>
      <p className="mt-2 text-[18px] font-semibold text-[#2f3440] dark:text-gray-100 md:text-[20px]">
        {metric.value}
      </p>
      {metric.trendLabel && metric.trendPercent !== undefined && (
        <p className="mt-0.5 text-[11px] text-[#707483] dark:text-gray-500">{metric.trendLabel}</p>
      )}
      {sparkData.length > 1 && (
        <div className="mt-2 h-[36px] w-full opacity-80">
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={FINANCE_CHART_COLORS.brand} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={FINANCE_CHART_COLORS.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={FINANCE_CHART_COLORS.brand}
                fill={`url(#spark-${metric.id})`}
                strokeWidth={1.5}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
