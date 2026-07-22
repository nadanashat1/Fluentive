"use client";

import clsx from "clsx";

export type PipelineTabKey = "all" | "active" | "closed";

const tabs: { key: PipelineTabKey; label: string }[] = [
  { key: "all", label: "All Deals" },
  { key: "active", label: "Active Deals" },
  { key: "closed", label: "Closed Deals" }
];

interface PipelineTabsProps {
  value: PipelineTabKey;
  onChange: (v: PipelineTabKey) => void;
}

export function PipelineTabs({ value, onChange }: PipelineTabsProps) {
  return (
    <div className="flex items-center gap-5">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={clsx(
            "relative pb-2 text-[12px] font-semibold transition-colors",
            value === t.key
              ? "text-brand"
              : "text-[#707483] hover:text-[#2f3440] dark:text-gray-400 dark:hover:text-gray-200"
          )}
        >
          {t.label}
          {value === t.key && (
            <span className="absolute -bottom-[1px] left-0 h-[2px] w-full rounded-full bg-brand" />
          )}
        </button>
      ))}
    </div>
  );
}
