import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isValid,
  parseISO,
  differenceInCalendarDays,
  isMonday,
} from "date-fns";

/** Parse timestamps from API/DB without producing Invalid Date in the UI. */
export function parseActivityTimestamp(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const iso = parseISO(trimmed);
    if (isValid(iso)) return iso;
    const fallback = new Date(trimmed);
    return isValid(fallback) ? fallback : null;
  }
  return null;
}

export function toActivityISOString(value: unknown): string | null {
  const d = parseActivityTimestamp(value);
  return d ? d.toISOString() : null;
}

/** Relative label with full timestamp for title/hover. */
export function formatActivityTime(value: unknown): {
  relative: string;
  full: string;
  date: Date | null;
} {
  const date = parseActivityTimestamp(value);
  if (!date) {
    return { relative: "—", full: "—", date: null };
  }

  const full = format(date, "PPpp");
  const now = new Date();

  if (isToday(date)) {
    const minutesAgo = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (minutesAgo < 1) return { relative: "Just now", full, date };
    if (minutesAgo < 60) {
      return {
        relative: `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`,
        full,
        date,
      };
    }
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full,
      date,
    };
  }

  if (isYesterday(date)) {
    return {
      relative: `Yesterday at ${format(date, "h:mm a")}`,
      full,
      date,
    };
  }

  const daysAgo = differenceInCalendarDays(now, date);
  if (daysAgo >= 2 && daysAgo <= 7) {
    if (isMonday(date) && daysAgo <= 6) {
      return {
        relative: `Last Monday at ${format(date, "h:mm a")}`,
        full,
        date,
      };
    }
    return {
      relative: `${format(date, "EEEE")} at ${format(date, "h:mm a")}`,
      full,
      date,
    };
  }

  if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full,
      date,
    };
  }

  return {
    relative: format(date, "MMM d, yyyy h:mm a"),
    full,
    date,
  };
}
