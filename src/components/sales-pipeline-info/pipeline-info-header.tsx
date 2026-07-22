import React from "react";

export function PipelineInfoHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#ececef] bg-[#f5f6fb] px-4 pt-5 dark:border-[#2a2f3a] dark:bg-[#0b0614] sm:px-6">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-[18px] font-semibold text-[#2f3440] dark:text-gray-100 md:text-[20px]">
              {title}
            </h1>
            <p className="mt-1 max-w-[520px] text-[12px] text-[#707483] dark:text-gray-400">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center justify-start md:justify-end">{action}</div>
        </div>
      </div>
    </div>
  );
}
