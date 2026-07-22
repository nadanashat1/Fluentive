"use client";

import { Search, Calendar, Filter, Download } from "lucide-react";
import type { FinanceDateRange, FinanceFiltersState } from "@/lib/finance/types";

interface FinanceFiltersProps {
  filters: FinanceFiltersState;
  customers: string[];
  onChange: (patch: Partial<FinanceFiltersState>) => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

const RANGE_OPTIONS: { value: FinanceDateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "quarter", label: "Quarter" },
  { value: "1y", label: "1 year" },
  { value: "year", label: "Year" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "PAID", label: "Paid" },
  { value: "SENT", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "DRAFT", label: "Draft" },
  { value: "CANCELLED", label: "Failed" },
];

export function FinanceFilters({
  filters,
  customers,
  onChange,
  onExportCsv,
  onExportPdf,
}: FinanceFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#ececef] bg-white p-4 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-brand shrink-0" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#707483] dark:text-gray-500">
          Filters
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search invoices, clients..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="h-10 w-full rounded-soft border border-[#dbc4cf] bg-white pl-10 pr-4 text-[13px] outline-none focus:ring-2 focus:ring-brand/20 dark:border-[#2a2f3a] dark:bg-[#0b0614]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="shrink-0 text-gray-400" />
          <select
            value={filters.range}
            onChange={(e) => onChange({ range: e.target.value as FinanceDateRange })}
            className="h-10 w-full rounded-soft border border-[#dbc4cf] bg-white px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0b0614]"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={filters.period}
          onChange={(e) =>
            onChange({ period: e.target.value as FinanceFiltersState["period"] })
          }
          className="h-10 w-full rounded-soft border border-[#dbc4cf] bg-white px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0b0614]"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          className="h-10 w-full rounded-soft border border-[#dbc4cf] bg-white px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0b0614]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={filters.customer}
          onChange={(e) => onChange({ customer: e.target.value })}
          className="h-10 w-full rounded-soft border border-[#dbc4cf] bg-white px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0b0614]"
        >
          <option value="all">All customers</option>
          {customers.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.revenueSource}
          onChange={(e) => onChange({ revenueSource: e.target.value })}
          className="h-10 w-full rounded-soft border border-[#dbc4cf] bg-white px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0b0614]"
        >
          <option value="all">All revenue sources</option>
          <option value="invoices">Invoices</option>
          <option value="deals">Deals</option>
          <option value="subscriptions">Subscriptions</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex h-9 items-center gap-2 rounded-soft border border-[#dbc4cf] px-3 text-[12px] font-semibold text-[#2f3440] transition hover:bg-gray-50 dark:border-[#2a2f3a] dark:text-gray-200 dark:hover:bg-[#0f0820]"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex h-9 items-center gap-2 rounded-soft border border-brand/30 bg-brand/5 px-3 text-[12px] font-semibold text-brand transition hover:bg-brand/10"
          >
            <Download size={14} />
            Print summary
          </button>
        )}
      </div>
    </div>
  );
}
