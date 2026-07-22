"use client";

import type { ReactNode } from "react";
import { SafeChart } from "./safe-chart";

interface FinanceChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function FinanceChartContainer({
  title,
  subtitle,
  children,
  action,
  className = "",
}: FinanceChartContainerProps) {
  return (
    <div
      className={`rounded-xl border border-[#ececef] bg-white p-4 md:p-5 shadow-[0_8px_24px_rgba(18,20,31,0.04)] dark:border-[#2a2f3a] dark:bg-[#1a0b2e] ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#2f3440] dark:text-gray-100">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[12px] text-[#707483] dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <SafeChart>{children}</SafeChart>
    </div>
  );
}
