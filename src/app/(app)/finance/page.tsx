"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, DollarSign, Settings } from "lucide-react";
import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import { apiFetch } from "@/lib/api-client";
import {
  FinanceMetricsGrid,
  FinanceFilters,
  FinanceInsightsStrip,
  FinanceChartsSection,
  FinanceInvoicesSection,
  FinanceTimeline,
  FinanceOperationalMetrics,
} from "@/components/finance";
import {
  DEFAULT_ANALYTICS,
  buildFinanceMetrics,
  buildOperationalMetrics,
  buildFinanceInsights,
  buildTransactionTimeline,
  filterInvoicesClient,
  getUniqueCustomers,
  exportInvoicesToCsv,
  exportMetricsToCsv,
  printFinanceSummary,
} from "@/lib/finance";
import type {
  FinanceAnalytics,
  FinanceFiltersState,
  FinanceInvoice,
} from "@/lib/finance/types";
import { formatCurrency } from "@/lib/finance/formatters";
import { SalesStatsCard } from "@/components/sales-pipeline/sales-stats-card";

const defaultFilters: FinanceFiltersState = {
  range: "30d",
  period: "monthly",
  status: "all",
  customer: "all",
  revenueSource: "all",
  search: "",
};

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FinanceFiltersState>(defaultFilters);

  const updateFilters = useCallback((patch: Partial<FinanceFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["finance-analytics", filters.range],
    queryFn: async () => apiFetch<{ success: boolean; data: FinanceAnalytics }>(
      `/api/finance/analytics?range=${filters.range}`
    ),
  });

  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["finance-invoices", { search: filters.search, status: filters.status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      const qs = params.toString();
      return apiFetch<{ success: boolean; data: FinanceInvoice[] }>(
        `/api/finance/invoices${qs ? `?${qs}` : ""}`
      );
    },
  });

  const analytics: FinanceAnalytics = analyticsData?.data ?? DEFAULT_ANALYTICS;
  const allInvoices: FinanceInvoice[] = invoicesData?.data ?? [];

  const filteredInvoices = useMemo(
    () =>
      filterInvoicesClient(allInvoices, {
        status: filters.status !== "all" ? filters.status : undefined,
        customer: filters.customer !== "all" ? filters.customer : undefined,
        search: filters.search || undefined,
      }),
    [allInvoices, filters.status, filters.customer, filters.search]
  );

  const metrics = useMemo(
    () => buildFinanceMetrics(analytics, allInvoices),
    [analytics, allInvoices]
  );
  const operational = useMemo(
    () => buildOperationalMetrics(analytics, allInvoices),
    [analytics, allInvoices]
  );
  const insights = useMemo(
    () => buildFinanceInsights(analytics, allInvoices),
    [analytics, allInvoices]
  );
  const timeline = useMemo(() => buildTransactionTimeline(allInvoices), [allInvoices]);
  const customers = useMemo(() => getUniqueCustomers(allInvoices), [allInvoices]);

  const handleMarkPaid = async (id: string) => {
    await apiFetch("/api/finance/invoices", {
      method: "PATCH",
      body: JSON.stringify({ id, status: "PAID" }),
    });
    await queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
    await queryClient.invalidateQueries({ queryKey: ["finance-analytics"] });
  };

  const handleExportCsv = () => {
    exportInvoicesToCsv(filteredInvoices);
    exportMetricsToCsv(metrics);
  };

  const handleExportPdf = () => {
    printFinanceSummary("Finance Summary", [
      `Total revenue: ${formatCurrency(analytics.revenue)}`,
      `Expenses: ${formatCurrency(analytics.expenses)}`,
      `Net profit: ${formatCurrency(analytics.profit)} (${analytics.profitMargin.toFixed(1)}% margin)`,
      `Outstanding: ${formatCurrency(analytics.outstandingInvoices)}`,
      `Financial health score: ${operational.financialHealthScore}/100`,
      `MRR: ${formatCurrency(operational.mrr)} | ARR: ${formatCurrency(operational.arr)}`,
    ]);
  };

  return (
    <div className="min-h-full bg-[#f5f6fb] dark:bg-[#0b0614]">
      <div className="mx-auto w-full max-w-[1920px] space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[#2f3440] dark:text-gray-100 md:text-3xl">
              Finance & Accounting
              <DollarSign className="text-emerald-500" size={28} />
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Executive overview of revenue, cash flow, invoices, and financial health.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/finance/settings">
              <ActionButton className="inline-flex h-10 items-center justify-center gap-2 rounded-soft border border-[#dbc4cf] bg-white px-4 text-[13px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-[#2a2f3a] dark:bg-[#150a24] dark:text-gray-200">
                <Settings size={18} />
                Settings
              </ActionButton>
            </Link>
            <Link href="/finance/invoices/new">
              <ActionButton className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95">
                <Plus size={18} />
                Create Invoice
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Legacy headline cards — preserved for compatibility */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SalesStatsCard
            title="Total Revenue"
            value={formatCurrency(analytics.revenue)}
            delta={
              analytics.revenueGrowthPercent !== undefined
                ? `${analytics.revenueGrowthPercent >= 0 ? "+" : ""}${analytics.revenueGrowthPercent.toFixed(1)}%`
                : filters.range
            }
            deltaPositive={(analytics.revenueGrowthPercent ?? 0) >= 0}
          />
          <SalesStatsCard
            title="Total Expenses"
            value={formatCurrency(analytics.expenses)}
            delta={filters.range}
            deltaPositive={false}
          />
          <SalesStatsCard
            title="Net Profit"
            value={formatCurrency(analytics.profit)}
            delta={`${analytics.profitMargin.toFixed(1)}% Margin`}
            deltaPositive={analytics.profit > 0}
          />
          <SalesStatsCard
            title="Outstanding Invoices"
            value={formatCurrency(analytics.outstandingInvoices)}
            delta="Requires Follow-up"
            deltaPositive={analytics.outstandingInvoices === 0}
          />
        </div>

        <FinanceFilters
          filters={filters}
          customers={customers}
          onChange={updateFilters}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
        />

        <FinanceInsightsStrip insights={insights} isLoading={isLoadingAnalytics} />

        <FinanceMetricsGrid metrics={metrics} isLoading={isLoadingAnalytics} />

        <FinanceChartsSection
          analytics={analytics}
          invoices={allInvoices}
          isLoading={isLoadingAnalytics}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FinanceInvoicesSection
              invoices={filteredInvoices}
              isLoading={isLoadingInvoices}
              search={filters.search}
              onMarkPaid={handleMarkPaid}
            />
          </div>
          <div>
            <FinanceTimeline events={timeline} isLoading={isLoadingInvoices} />
          </div>
        </div>

        <FinanceOperationalMetrics metrics={operational} isLoading={isLoadingAnalytics} />
      </div>
    </div>
  );
}
