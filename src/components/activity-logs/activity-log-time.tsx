"use client";

import { formatActivityTime } from "@/lib/activity-logs/format-time";

export function ActivityLogTime({ value }: { value: string }) {
  const { relative, full } = formatActivityTime(value);
  return (
    <time dateTime={value || undefined} title={full} className="cursor-default whitespace-nowrap text-[13px] text-[#646b7a] dark:text-gray-400">
      {relative}
    </time>
  );
}
