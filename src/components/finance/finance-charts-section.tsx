"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ComposedChart,
} from "recharts";
import { FinanceChartContainer } from "./finance-chart-container";
import { FINANCE_CHART_COLORS } from "@/lib/finance/constants";
import { formatCurrency } from "@/lib/finance/formatters";
import type { FinanceAnalytics, FinanceInvoice } from "@/lib/finance/types";
import {
  enrichMonthlyData,
  buildForecastChartData,
  buildRevenueBySource,
  buildPaymentTrends,
} from "@/lib/finance/metrics";

type CashFlowGranularity = "weekly" | "monthly" | "yearly";

interface FinanceChartsSectionProps {
  analytics: FinanceAnalytics;
  invoices: FinanceInvoice[];
  isLoading?: boolean;
}

function sliceByGranularity(
  data: { name: string; revenue: number; expenses: number; profit?: number }[],
  granularity: CashFlowGranularity
) {
  if (granularity === "monthly") return data;
  if (granularity === "weekly") return data.slice(-4);
  return data.filter((_, i) => i % 3 === 0 || i === data.length - 1);
}

function ChartSkeleton() {
  return <div className="h-[260px] animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/40" />;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1a0b2e",
    borderColor: "#2a2f3a",
    borderRadius: "8px",
    fontSize: "13px",
  },
  itemStyle: { color: "#e5e7eb" },
};

function currencyTooltip(value: unknown): string {
  return formatCurrency(Number(value ?? 0));
}

function percentTooltip(value: unknown): string {
  return `${(Number(value ?? 0) * 100).toFixed(0)}%`;
}

export function FinanceChartsSection({
  analytics,
  invoices,
  isLoading,
}: FinanceChartsSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [granularity, setGranularity] = useState<CashFlowGranularity>("monthly");
  useEffect(() => setMounted(true), []);

  const monthly = useMemo(() => {
    const base = enrichMonthlyData(analytics);
    return sliceByGranularity(base, granularity);
  }, [analytics, granularity]);
  const forecast = buildForecastChartData(analytics);
  const bySource = buildRevenueBySource(analytics);
  const paymentTrends = buildPaymentTrends(analytics, invoices);

  if (isLoading || !mounted) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <FinanceChartContainer key={i} title="Loading...">
            <ChartSkeleton />
          </FinanceChartContainer>
        ))}
      </div>
    );
  }

  const hasMonthly = monthly.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      <FinanceChartContainer
        title="Cash Flow Overview"
        subtitle="Revenue vs expenses by period"
        className="xl:col-span-2"
        action={
          <div className="flex gap-1 rounded-lg border border-[#ececef] p-0.5 dark:border-[#2a2f3a]">
            {(["weekly", "monthly", "yearly"] as CashFlowGranularity[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                  granularity === g
                    ? "bg-brand text-white"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        }
      >
        {hasMonthly ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="finRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={FINANCE_CHART_COLORS.success} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={FINANCE_CHART_COLORS.success} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={FINANCE_CHART_COLORS.danger} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={FINANCE_CHART_COLORS.danger} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip {...tooltipStyle} formatter={currencyTooltip} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={FINANCE_CHART_COLORS.success} fill="url(#finRev)" strokeWidth={2} animationDuration={1200} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke={FINANCE_CHART_COLORS.danger} fill="url(#finExp)" strokeWidth={2} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Add invoices and expenses to see cash flow" />
        )}
      </FinanceChartContainer>

      <FinanceChartContainer title="Revenue vs Expenses" subtitle="Side-by-side comparison">
        {hasMonthly ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip {...tooltipStyle} formatter={currencyTooltip} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill={FINANCE_CHART_COLORS.brand} radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="expenses" name="Expenses" fill={FINANCE_CHART_COLORS.muted} radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No comparison data yet" />
        )}
      </FinanceChartContainer>

      <FinanceChartContainer title="Profitability Trends" subtitle="Net profit by month">
        {hasMonthly ? (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip {...tooltipStyle} formatter={currencyTooltip} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke={FINANCE_CHART_COLORS.brand} strokeWidth={2.5} dot={{ r: 3 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Profit trends appear with monthly data" />
        )}
      </FinanceChartContainer>

      <FinanceChartContainer title="Invoice Payment Trends" subtitle="Paid, pending, overdue">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={paymentTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip {...tooltipStyle} formatter={currencyTooltip} />
              <Legend />
              <Bar dataKey="paid" stackId="a" fill={FINANCE_CHART_COLORS.success} />
              <Bar dataKey="pending" stackId="a" fill={FINANCE_CHART_COLORS.info} />
              <Bar dataKey="overdue" stackId="a" fill={FINANCE_CHART_COLORS.danger} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FinanceChartContainer>

      <FinanceChartContainer title="Revenue Forecast" subtitle="Actual vs projected">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip {...tooltipStyle} formatter={currencyTooltip} />
              <Legend />
              <Bar dataKey="actual" name="Actual" fill={FINANCE_CHART_COLORS.brand} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke={FINANCE_CHART_COLORS.warning} strokeWidth={2} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </FinanceChartContainer>

      <FinanceChartContainer title="Revenue by Source" subtitle="Attribution breakdown">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={bySource}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                animationDuration={1000}
              >
                {bySource.map((_, i) => (
                  <Cell key={i} fill={FINANCE_CHART_COLORS.chart[i % FINANCE_CHART_COLORS.chart.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={currencyTooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </FinanceChartContainer>

      <FinanceChartContainer title="Client Payment Behavior" subtitle="Collection velocity">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={paymentTrends.map((p) => ({
                name: p.name,
                collectionRate: p.paid / Math.max(p.paid + p.pending + p.overdue, 1),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <Tooltip {...tooltipStyle} formatter={percentTooltip} />
              <Area type="monotone" dataKey="collectionRate" name="Collection rate" stroke={FINANCE_CHART_COLORS.brand} fill={FINANCE_CHART_COLORS.brand} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </FinanceChartContainer>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
