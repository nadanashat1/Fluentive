import { TrendingUp, TrendingDown } from "lucide-react";

interface SalesStatsCardProps {
  title: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
}

export function SalesStatsCard({
  title,
  value,
  delta,
  deltaPositive
}: SalesStatsCardProps) {
  return (
    <div className="rounded-xl border border-[#ececef] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(18,20,31,0.06)] dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:text-gray-500">
          {title}
        </p>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
            deltaPositive
              ? "bg-[#f2fbf6] text-[#1d8a51] dark:bg-green-900/20 dark:text-green-300"
              : "bg-[#fff1f1] text-[#d64040] dark:bg-red-900/20 dark:text-red-300"
          }`}
        >
          {deltaPositive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          <span>{delta}</span>
        </div>
      </div>
      <p className="mt-2 text-[20px] font-semibold text-[#2f3440] dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}
