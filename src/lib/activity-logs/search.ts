import type { EnrichedActivityLog } from "./types";

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Simple fuzzy score: higher = better match */
export function fuzzyScore(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return 1;
  if (h === n) return 100;
  if (h.includes(n)) return 80;
  if (h.startsWith(n)) return 70;

  let score = 0;
  let hi = 0;
  for (const char of n) {
    const idx = h.indexOf(char, hi);
    if (idx === -1) return 0;
    score += 1;
    hi = idx + 1;
  }
  return Math.round((score / n.length) * 50);
}

export function activityMatchesSearch(log: EnrichedActivityLog, term: string): boolean {
  if (!term.trim()) return true;

  const fields = [
    log.action,
    log.details,
    log.label,
    log.category,
    log.severity,
    log.user.name,
    log.user.email ?? "",
    log.ipAddress,
    log.metadata.route ?? "",
    log.metadata.requestId ?? "",
    JSON.stringify(log.metadata),
  ].join(" ");

  return fuzzyScore(fields, term) > 0;
}

export function filterActivityLogs(
  logs: EnrichedActivityLog[],
  term: string
): EnrichedActivityLog[] {
  if (!term.trim()) return logs;
  return logs
    .map((log) => ({ log, score: fuzzyScore(
      [
        log.action,
        log.details,
        log.label,
        log.category,
        log.user.name,
        log.ipAddress,
      ].join(" "),
      term
    ) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.log);
}
