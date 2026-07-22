"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { RefreshCw, Download, ClipboardList } from "lucide-react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { ActivityLogsFiltersBar } from "@/components/activity-logs/activity-logs-filters";
import { ActivityLogRow } from "@/components/activity-logs/activity-log-row";
import { ActivitySummaryCards } from "@/components/activity-logs/activity-summary-cards";
import { ActivityEmptyState } from "@/components/activity-logs/activity-empty-state";
import type { FilterPresetId } from "@/components/activity-logs/activity-filter-presets";
import { buildDisplayItems } from "@/lib/activity-logs/aggregate";
import { filterActivityLogs } from "@/lib/activity-logs/search";
import { computeActivitySummaries } from "@/lib/activity-logs/summaries";
import type { ActivityLogsFilters } from "@/lib/activity-logs/types";

const DEFAULT_FILTERS: ActivityLogsFilters = {
  page: 1,
  limit: 50,
};

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState<ActivityLogsFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activePreset, setActivePreset] = useState<FilterPresetId>("all");
  const [timelineMode, setTimelineMode] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [filters, debouncedSearch]
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useActivityLogs(queryFilters);

  const logs = data?.data ?? [];
  const pagination = data?.pagination;
  const hiddenHeartbeats = data?.meta?.hiddenHeartbeatCount ?? 0;

  const summary = useMemo(() => computeActivitySummaries(logs), [logs]);

  const clientFiltered = useMemo(() => {
    let list = filterActivityLogs(logs, debouncedSearch);
    if (activePreset === "exports") {
      list = list.filter((l) => l.category === "EXPORT" || l.category === "IMPORT");
    }
    return list;
  }, [logs, debouncedSearch, activePreset]);

  const { items } = useMemo(
    () =>
      buildDisplayItems(clientFiltered, {
        collapseHeartbeats: !filters.includeNoise,
        dedupeRepeats: true,
      }),
    [clientFiltered, filters.includeNoise]
  );

  const hasFilters =
    !!debouncedSearch ||
    activePreset !== "all" ||
    !!filters.errorsOnly ||
    !!filters.dateFrom ||
    !!filters.includeNoise;

  const patchFilters = useCallback((patch: Partial<ActivityLogsFilters>) => {
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  }, []);

  const handlePreset = useCallback((id: FilterPresetId, patch: Partial<ActivityLogsFilters>) => {
    setActivePreset(id);
    if (id === "all") {
      setSearchInput("");
      setDebouncedSearch("");
      setFilters({ ...DEFAULT_FILTERS, page: 1 });
      return;
    }
    setFilters((f) => ({
      ...DEFAULT_FILTERS,
      ...patch,
      search: f.search,
      page: 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setActivePreset("all");
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleExport = () => {
    const rows = clientFiltered.map((log) => ({
      time: log.createdAt,
      summary: log.label,
      category: log.category,
      severity: log.severity,
      user: log.user.name,
      details: log.details,
      leadId: log.lead?.id ?? "",
      dealId: log.deal?.id ?? "",
      entityType: log.metadata?.entityType ?? "",
      entityId: log.metadata?.entityId ?? "",
    }));
    const header = Object.keys(rows[0] ?? { time: "", summary: "" }).join(",");
    const body = rows
      .map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([[header, body].filter(Boolean).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filterTag = [
      activePreset !== "all" ? activePreset : "",
      filters.category && filters.category !== "all" ? filters.category : "",
      filters.errorsOnly ? "errors" : "",
      debouncedSearch ? "search" : "",
    ]
      .filter(Boolean)
      .join("-");
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}${filterTag ? `-${filterTag}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-28 w-full rounded-lg2" />
        <div className="skeleton h-24 w-full rounded-lg2" />
        <div className="skeleton h-64 w-full rounded-lg2" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#f25572]">Couldn&apos;t load activity</p>
          <p className="mt-1 text-[14px] text-[#8b8f9b] dark:text-gray-400">
            {(error as Error)?.message ?? "Please try refreshing the page."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-soft border px-4 py-2 text-[13px] font-semibold"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#2f3440] dark:text-gray-100">
            <ClipboardList size={24} className="text-[#840A36]" aria-hidden />
            Activity History
          </h1>
          <p className="mt-1 max-w-xl text-[14px] text-[#646b7a] dark:text-gray-400">
            See what happened in your workspace — who did what, when it mattered, and what needs
            attention. No technical knowledge required.
          </p>
          {hiddenHeartbeats > 0 && (
            <p className="mt-2 text-[12px] text-[#8b8f9b]">
              {hiddenHeartbeats} routine heartbeat{hiddenHeartbeats === 1 ? "" : "s"} hidden to
              keep this feed readable.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTimelineMode((v) => !v)}
            className={`rounded-soft border px-4 py-2 text-[13px] font-semibold transition ${
              timelineMode
                ? "border-[#840A36] bg-[#840A36]/10 text-[#840A36]"
                : "border-[#e1e3e9] text-[#646b7a] dark:border-[#2a2f3a] dark:text-gray-400"
            }`}
          >
            {timelineMode ? "Timeline on" : "Timeline view"}
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-soft border border-[#e1e3e9] px-4 py-2 text-[13px] font-semibold text-[#646b7a] transition hover:bg-[#f8f9fa] disabled:opacity-50 dark:border-[#2a2f3a] dark:text-gray-400"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={clientFiltered.length === 0}
            className="flex items-center gap-2 rounded-soft border border-[#e1e3e9] px-4 py-2 text-[13px] font-semibold text-[#646b7a] transition hover:bg-[#f8f9fa] disabled:opacity-50 dark:border-[#2a2f3a] dark:text-gray-400"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <ActivitySummaryCards summary={summary} />

      {summary.needsAttention > 0 && (
        <div className="rounded-lg2 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="font-semibold">{summary.needsAttention} item{summary.needsAttention === 1 ? "" : "s"} need attention</span>
          {" — "}
          review warnings, failed sign-ins, or unusual activity below.
        </div>
      )}

      <ActivityLogsFiltersBar
        filters={{ ...filters, search: searchInput }}
        activePreset={activePreset}
        onPresetSelect={handlePreset}
        onChange={(patch) => {
          if ("search" in patch) {
            setSearchInput(patch.search ?? "");
            setActivePreset("all");
          } else {
            patchFilters(patch);
            setActivePreset("all");
          }
        }}
        onReset={resetFilters}
      />

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] overflow-hidden">
        {items.length === 0 ? (
          <ActivityEmptyState hasFilters={hasFilters} />
        ) : (
          <div className="max-h-[calc(100vh-340px)] overflow-y-auto divide-y divide-[#f0f1f3] dark:divide-[#2a2f3a]">
            {items.map((item) => (
              <ActivityLogRow
                key={item.groupedIds.join("-")}
                item={item}
                timelineMode={timelineMode}
              />
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-[#ececef] px-4 py-3 dark:border-[#2a2f3a]">
            <button
              type="button"
              disabled={!pagination.hasPrev}
              onClick={() => patchFilters({ page: (filters.page ?? 1) - 1 })}
              className="rounded-soft border px-3 py-1.5 text-[12px] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-[12px] text-[#8b8f9b]">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => patchFilters({ page: (filters.page ?? 1) + 1 })}
              className="rounded-soft border px-3 py-1.5 text-[12px] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
