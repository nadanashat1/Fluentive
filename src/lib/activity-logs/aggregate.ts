import type { EnrichedActivityLog } from "./types";

export interface DisplayActivityItem {
  kind: "single" | "heartbeat-group" | "repeat-group";
  log: EnrichedActivityLog;
  count: number;
  groupedIds: string[];
  latestAt: string;
  earliestAt: string;
}

function groupKey(log: EnrichedActivityLog): string {
  return `${log.user.id ?? log.user.name}|${log.action}|${log.category}`;
}

/** Collapse heartbeat spam and surface repeat counts without deleting data. */
export function buildDisplayItems(
  logs: EnrichedActivityLog[],
  options?: { collapseHeartbeats?: boolean; dedupeRepeats?: boolean }
): { items: DisplayActivityItem[]; hiddenHeartbeatCount: number } {
  const collapseHeartbeats = options?.collapseHeartbeats !== false;
  const dedupeRepeats = options?.dedupeRepeats !== false;

  let hiddenHeartbeatCount = 0;
  const items: DisplayActivityItem[] = [];
  let i = 0;

  while (i < logs.length) {
    const log = logs[i];

    if (collapseHeartbeats && log.isHeartbeat) {
      const groupedIds = [log.id];
      let j = i + 1;
      const userKey = log.user.id ?? log.user.name;
      while (
        j < logs.length &&
        logs[j].isHeartbeat &&
        (logs[j].user.id ?? logs[j].user.name) === userKey
      ) {
        groupedIds.push(logs[j].id);
        j++;
      }
      hiddenHeartbeatCount += groupedIds.length - 1;
      const latest = logs[i];
      const earliest = logs[j - 1];
      items.push({
        kind: "heartbeat-group",
        log: {
          ...latest,
          label: `User heartbeat (${groupedIds.length} pulses)`,
          details: `Aggregated session presence · last idle state from most recent pulse`,
          repeatCount: groupedIds.length,
        },
        count: groupedIds.length,
        groupedIds,
        latestAt: latest.createdAt,
        earliestAt: earliest.createdAt,
      });
      i = j;
      continue;
    }

    if (dedupeRepeats) {
      const key = groupKey(log);
      const groupedIds = [log.id];
      let j = i + 1;
      while (j < logs.length && !logs[j].isHeartbeat && groupKey(logs[j]) === key) {
        groupedIds.push(logs[j].id);
        j++;
      }
      if (groupedIds.length > 1) {
        items.push({
          kind: "repeat-group",
          log: {
            ...log,
            repeatCount: groupedIds.length,
            label: `${log.label} (×${groupedIds.length})`,
          },
          count: groupedIds.length,
          groupedIds,
          latestAt: log.createdAt,
          earliestAt: logs[j - 1].createdAt,
        });
        i = j;
        continue;
      }
    }

    items.push({
      kind: "single",
      log,
      count: 1,
      groupedIds: [log.id],
      latestAt: log.createdAt,
      earliestAt: log.createdAt,
    });
    i++;
  }

  return { items, hiddenHeartbeatCount };
}
