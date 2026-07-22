"use client";

import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ActivityLogsFilters, ActivityEventCategory, ActivitySeverity } from "@/lib/activity-logs/types";
import { CATEGORY_CONFIG } from "@/lib/activity-logs/event-config";
import { ActivityFilterPresets, type FilterPresetId, getRecentChangesPatch } from "./activity-filter-presets";

const CATEGORIES: Array<ActivityEventCategory | "all"> = [
  "all",
  "AUTH",
  "LEAD",
  "DEAL",
  "AI",
  "SECURITY",
  "USER",
  "SYSTEM",
  "EXPORT",
  "IMPORT",
];

const SEVERITIES: Array<ActivitySeverity | "all"> = [
  "all",
  "info",
  "warning",
  "error",
  "critical",
];

interface ActivityLogsFiltersBarProps {
  filters: ActivityLogsFilters;
  activePreset: FilterPresetId;
  onPresetSelect: (id: FilterPresetId, patch: Partial<ActivityLogsFilters>) => void;
  onChange: (patch: Partial<ActivityLogsFilters>) => void;
  onReset: () => void;
}

export function ActivityLogsFiltersBar({
  filters,
  activePreset,
  onPresetSelect,
  onChange,
  onReset,
}: ActivityLogsFiltersBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvanced =
    (filters.category && filters.category !== "all") ||
    (filters.severity && filters.severity !== "all") ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.ip ||
    filters.organizationId ||
    filters.includeNoise;

  return (
    <div className="sticky top-0 z-20 space-y-3 rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-[#1a0b2e]/95">
      <ActivityFilterPresets
        activePreset={activePreset}
        onSelect={(id, patch) => {
          if (id === "changes") {
            onPresetSelect(id, { ...patch, ...getRecentChangesPatch() });
          } else {
            onPresetSelect(id, patch);
          }
        }}
      />

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b9fad] dark:text-gray-500"
        />
        <input
          type="search"
          placeholder="Search by person, lead, deal, or activity…"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] bg-white dark:bg-[#0f0820] py-2 pl-9 pr-3 text-[13px] text-[#2f3440] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1 text-[12px] font-semibold text-[#646b7a] dark:text-gray-400"
      >
        <Filter size={14} />
        {showAdvanced ? "Hide" : "Show"} advanced filters
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#ececef] pt-3 dark:border-[#2a2f3a]">
          <select
            value={filters.category ?? "all"}
            onChange={(e) =>
              onChange({ category: e.target.value as ActivityLogsFilters["category"] })
            }
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] bg-white dark:bg-[#0f0820] px-2 py-1.5 text-[12px]"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : CATEGORY_CONFIG[c].label}
              </option>
            ))}
          </select>
          <select
            value={filters.severity ?? "all"}
            onChange={(e) =>
              onChange({ severity: e.target.value as ActivityLogsFilters["severity"] })
            }
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] bg-white dark:bg-[#0f0820] px-2 py-1.5 text-[12px]"
            aria-label="Filter by severity"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All levels" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] bg-white dark:bg-[#0f0820] px-2 py-1.5 text-[12px]"
            aria-label="From date"
          />
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] bg-white dark:bg-[#0f0820] px-2 py-1.5 text-[12px]"
            aria-label="To date"
          />
          <input
            type="text"
            placeholder="IP (advanced)"
            value={filters.ip ?? ""}
            onChange={(e) => onChange({ ip: e.target.value || undefined })}
            className="w-28 rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] bg-white dark:bg-[#0f0820] px-2 py-1.5 font-mono text-[12px]"
          />
          <label className="inline-flex items-center gap-1.5 text-[12px] text-[#646b7a]">
            <input
              type="checkbox"
              checked={!!filters.errorsOnly}
              onChange={(e) => onChange({ errorsOnly: e.target.checked })}
            />
            Problems only
          </label>
          <label className="inline-flex items-center gap-1.5 text-[12px] text-[#646b7a]">
            <input
              type="checkbox"
              checked={!!filters.includeNoise}
              onChange={(e) => onChange({ includeNoise: e.target.checked })}
            />
            Show heartbeats
          </label>
          {(hasAdvanced || filters.errorsOnly) && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-soft border px-2 py-1 text-[12px] text-[#646b7a] hover:bg-[#f8f9fa] dark:hover:bg-[#1f1035]"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
