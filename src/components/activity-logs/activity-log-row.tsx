"use client";

import { useState, useMemo, memo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, AlertCircle, Code2, ExternalLink } from "lucide-react";
import { CategoryBadge, SeverityBadge } from "./activity-log-badges";
import { ActivityLogTime } from "./activity-log-time";
import { CATEGORY_CONFIG } from "@/lib/activity-logs/event-config";
import type { DisplayActivityItem } from "@/lib/activity-logs/aggregate";
import { humanizeGroupSummary } from "@/lib/activity-logs/humanize";
import { IMPORTANCE_STYLES } from "@/lib/activity-logs/importance";
import { getActivityEntityLink } from "@/lib/activity-logs/entity-links";

interface ActivityLogRowProps {
  item: DisplayActivityItem;
  timelineMode?: boolean;
}

function ActivityLogRowInner({ item, timelineMode }: ActivityLogRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const { log, count } = item;

  const human = useMemo(() => humanizeGroupSummary(item), [item]);
  const entityLink = useMemo(() => getActivityEntityLink(log), [log]);
  const CategoryIcon = CATEGORY_CONFIG[log.category].icon;
  const styles = IMPORTANCE_STYLES[human.importance];

  return (
    <article
      className={`border-b border-[#f0f1f3] dark:border-[#2a2f3a] transition-colors ${styles.row} ${human.importance === "low" ? "py-2" : "py-0"} ${timelineMode ? "border-l-2 border-l-[#840A36]/40 pl-1" : ""}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`w-full px-4 text-left ${human.importance === "low" ? "py-2" : "py-4"}`}
        aria-expanded={expanded}
      >
        <div className="flex gap-3">
          <span className="mt-1 text-[#9b9fad]">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#1a0b2e] ${styles.ring}`}
          >
            <CategoryIcon size={18} className={styles.icon} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p
                className={`text-[15px] font-semibold leading-snug text-[#2f3440] dark:text-gray-100 ${
                  human.importance === "low" ? "text-[13px] font-medium text-[#646b7a]" : ""
                }`}
              >
                {human.headline}
              </p>
              <ActivityLogTime value={log.createdAt} />
            </div>

            {human.subline && (
              <p className="mt-1 text-[13px] text-[#646b7a] dark:text-gray-400">{human.subline}</p>
            )}

            {human.entityLine && (
              <p className="mt-1.5 text-[12px] font-medium text-[#840A36]/90 dark:text-[#f5c4d4]">
                {human.entityLine}
              </p>
            )}

            {entityLink && (
              <Link
                href={entityLink.href}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#840A36] hover:underline dark:text-[#f5c4d4]"
              >
                Open {entityLink.label}
                <ExternalLink size={12} aria-hidden />
              </Link>
            )}

            {human.changeLine && (
              <p className="mt-1 text-[13px] text-[#2f3440] dark:text-gray-300">
                <span className="text-[#8b8f9b]">What changed: </span>
                {human.changeLine}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CategoryBadge category={log.category} />
              <SeverityBadge severity={log.severity} />
              <span className="text-[12px] text-[#8b8f9b]">by {log.user.name}</span>
              {count > 1 && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/50">
                  {count} grouped
                </span>
              )}
            </div>

            {human.whyItMatters && human.importance !== "low" && (
              <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <p className="text-[12px] leading-relaxed text-amber-900 dark:text-amber-100">
                  <span className="font-semibold">Why this matters: </span>
                  {human.whyItMatters}
                </p>
              </div>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#ececef] bg-[#f8f9fb] px-4 pb-4 pt-2 dark:border-[#2a2f3a] dark:bg-[#0f0820]/60">
          <button
            type="button"
            onClick={() => setShowTechnical((v) => !v)}
            className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#646b7a] hover:text-[#840A36] dark:text-gray-400"
          >
            <Code2 size={14} />
            {showTechnical ? "Hide technical details" : "Show technical details"}
            {showTechnical ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {showTechnical && (
            <div className="space-y-3 rounded-lg border border-[#e1e3e9] bg-white p-3 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8f9b]">
                Developer metadata
              </p>
              <dl className="grid gap-2 text-[12px] sm:grid-cols-2">
                <div>
                  <dt className="text-[#8b8f9b]">System action</dt>
                  <dd className="font-mono text-[#646b7a]">{log.action}</dd>
                </div>
                <div>
                  <dt className="text-[#8b8f9b]">Raw details</dt>
                  <dd className="break-words text-[#646b7a]">{log.details}</dd>
                </div>
                <div>
                  <dt className="text-[#8b8f9b]">IP address</dt>
                  <dd className="font-mono">{log.ipAddress}</dd>
                </div>
                <div>
                  <dt className="text-[#8b8f9b]">User agent</dt>
                  <dd className="break-all text-[11px]">{log.userAgent}</dd>
                </div>
                {log.metadata.requestId && (
                  <div className="sm:col-span-2">
                    <dt className="text-[#8b8f9b]">Request / trace ID</dt>
                    <dd className="font-mono">{String(log.metadata.requestId)}</dd>
                  </div>
                )}
                {count > 1 && (
                  <div>
                    <dt className="text-[#8b8f9b]">Grouped record IDs</dt>
                    <dd className="font-mono text-[11px]">{item.groupedIds.length} events</dd>
                  </div>
                )}
              </dl>

              {Object.keys(log.metadata).length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-[#8b8f9b]">
                    Advanced diagnostics (JSON)
                  </p>
                  <pre className="max-h-40 overflow-auto rounded-md border border-[#e1e3e9] p-2 font-mono text-[10px] text-[#646b7a] dark:border-[#2a2f3a]">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                  <p className="mt-2 text-[10px] text-[#8b8f9b]">
                    Correlation IDs preserved for OpenTelemetry, Sentry, and distributed tracing.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export const ActivityLogRow = memo(ActivityLogRowInner);
