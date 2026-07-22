import type { EnrichedActivityLog } from "./types";

export type ActivityImportance = "low" | "normal" | "high" | "critical";

export function getActivityImportance(log: EnrichedActivityLog): ActivityImportance {
  if (log.severity === "critical" || log.isSuspicious) return "critical";
  if (
    log.severity === "error" ||
    log.category === "SECURITY" ||
    (log.category === "AUTH" && /fail|denied|invalid/i.test(`${log.action} ${log.details}`))
  ) {
    return "high";
  }
  if (
    log.severity === "warning" ||
    log.isSlowRequest ||
    log.category === "EXPORT" ||
    log.category === "IMPORT" ||
    /permission|role|billing|password|org.?switch/i.test(`${log.action} ${log.details}`)
  ) {
    return "high";
  }
  if (log.isLowPriority || log.isHeartbeat || log.action === "PAGE_VIEW") return "low";
  return "normal";
}

export const IMPORTANCE_STYLES: Record<
  ActivityImportance,
  { row: string; icon: string; ring: string }
> = {
  low: {
    row: "opacity-70",
    icon: "text-slate-400",
    ring: "",
  },
  normal: {
    row: "",
    icon: "text-[#840A36]",
    ring: "",
  },
  high: {
    row: "border-l-4 border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/15",
    icon: "text-amber-600",
    ring: "ring-1 ring-amber-200/60 dark:ring-amber-800/40",
  },
  critical: {
    row: "border-l-4 border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/25",
    icon: "text-rose-600",
    ring: "ring-1 ring-rose-300/70 dark:ring-rose-800/50",
  },
};
