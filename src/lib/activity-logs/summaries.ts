import { startOfDay, subDays, isAfter, parseISO, isValid } from "date-fns";
import type { EnrichedActivityLog } from "./types";

export interface ActivityDashboardSummary {
  actionsToday: number;
  warningsDetected: number;
  dealsThisWeek: number;
  failedLogins: number;
  aiErrors: number;
  mostActiveUser: string | null;
  mostActiveUserCount: number;
  exportsThisWeek: number;
  needsAttention: number;
}

function safeDate(iso: string): Date | null {
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

export function computeActivitySummaries(logs: EnrichedActivityLog[]): ActivityDashboardSummary {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = subDays(todayStart, 7);

  const meaningful = logs.filter((l) => !l.isHeartbeat);

  const actionsToday = meaningful.filter((l) => {
    const d = safeDate(l.createdAt);
    return d && isAfter(d, todayStart);
  }).length;

  const warningsDetected = logs.filter(
    (l) => l.severity === "warning" || l.severity === "critical"
  ).length;

  const dealsThisWeek = meaningful.filter((l) => {
    if (l.category !== "DEAL") return false;
    const d = safeDate(l.createdAt);
    return d && isAfter(d, weekStart) && /creat/i.test(`${l.action} ${l.details}`);
  }).length;

  const failedLogins = logs.filter(
    (l) =>
      l.category === "AUTH" &&
      /fail|denied|invalid|unauthorized/i.test(`${l.action} ${l.details}`)
  ).length;

  const aiErrors = logs.filter(
    (l) => l.category === "AI" && (l.severity === "error" || l.severity === "critical")
  ).length;

  const exportsThisWeek = meaningful.filter((l) => {
    if (l.category !== "EXPORT") return false;
    const d = safeDate(l.createdAt);
    return d && isAfter(d, weekStart);
  }).length;

  const userCounts = new Map<string, number>();
  for (const l of meaningful) {
    const key = l.user.name || "Unknown";
    userCounts.set(key, (userCounts.get(key) ?? 0) + 1);
  }
  let mostActiveUser: string | null = null;
  let mostActiveUserCount = 0;
  for (const [name, count] of userCounts) {
    if (count > mostActiveUserCount) {
      mostActiveUser = name;
      mostActiveUserCount = count;
    }
  }

  const needsAttention = logs.filter(
    (l) =>
      l.isSuspicious ||
      l.severity === "critical" ||
      l.severity === "error" ||
      (l.category === "AUTH" && /fail/i.test(l.details))
  ).length;

  return {
    actionsToday,
    warningsDetected,
    dealsThisWeek,
    failedLogins,
    aiErrors,
    mostActiveUser,
    mostActiveUserCount,
    exportsThisWeek,
    needsAttention,
  };
}
