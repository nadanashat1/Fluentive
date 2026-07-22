import React from "react";

export function PipelineInfoTopCard({
  title,
  rightAction,
  children
}: {
  title: string;
  rightAction: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#ececef] bg-white shadow-sm dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      <div className="flex items-center justify-between gap-3 border-b border-[#eef0f4] px-5 py-4 dark:border-[#1f2230]">
        <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
          {title}
        </div>
        <div className="flex items-center gap-2">{rightAction}</div>
      </div>

      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  );
}
