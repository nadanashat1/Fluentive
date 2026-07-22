import React from "react";
import clsx from "clsx";

export function PipelineInfoSection({
  title,
  right,
  className,
  children
}: {
  title: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg border border-[#eef0f4] bg-[#fafafd] px-4 py-3 dark:border-[#1f2230] dark:bg-[#0f0820]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
          {title}
        </div>
        {right ? <div className="text-[#a7a9b3]">{right}</div> : null}
      </div>

      <div className="mt-3">{children}</div>
    </section>
  );
}
