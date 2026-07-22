"use client";

import { CATEGORY_CONFIG, SEVERITY_CONFIG } from "@/lib/activity-logs/event-config";
import type { ActivityEventCategory, ActivitySeverity } from "@/lib/activity-logs/types";

export function CategoryBadge({ category }: { category: ActivityEventCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <Icon size={12} aria-hidden />
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: ActivitySeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}
