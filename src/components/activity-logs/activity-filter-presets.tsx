"use client";

import type { ActivityLogsFilters } from "@/lib/activity-logs/types";

export type FilterPresetId =
  | "all"
  | "security"
  | "ai"
  | "team"
  | "errors"
  | "changes"
  | "exports";

const PRESETS: Array<{
  id: FilterPresetId;
  label: string;
  patch: Partial<ActivityLogsFilters>;
}> = [
  { id: "all", label: "All activity", patch: {} },
  {
    id: "security",
    label: "Security",
    patch: { category: "SECURITY", severity: "all", errorsOnly: false },
  },
  {
    id: "ai",
    label: "AI Activity",
    patch: { category: "AI", severity: "all", errorsOnly: false },
  },
  {
    id: "team",
    label: "Team Actions",
    patch: { category: "USER", severity: "all", errorsOnly: false },
  },
  {
    id: "errors",
    label: "Errors Only",
    patch: { errorsOnly: true, category: "all", severity: "all" },
  },
  {
    id: "changes",
    label: "Recent Changes",
    patch: { category: "all", severity: "all", errorsOnly: false },
  },
  {
    id: "exports",
    label: "Exports & Imports",
    patch: { category: "all", severity: "all", errorsOnly: false },
  },
];

interface ActivityFilterPresetsProps {
  activePreset: FilterPresetId;
  onSelect: (id: FilterPresetId, patch: Partial<ActivityLogsFilters>) => void;
}

export function ActivityFilterPresets({ activePreset, onSelect }: ActivityFilterPresetsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelect(preset.id, preset.patch)}
          className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
            activePreset === preset.id
              ? "border-[#840A36] bg-[#840A36] text-white"
              : "border-[#e1e3e9] bg-white text-[#646b7a] hover:bg-[#f8f9fa] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-400 dark:hover:bg-[#1f1035]"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export function getRecentChangesPatch(): Partial<ActivityLogsFilters> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 3);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}
