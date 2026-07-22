import React from "react";
import clsx from "clsx";

export function AddDealSection({
  title,
  iconClassName,
  className,
  children
}: {
  title: string;
  iconClassName: string;
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
      <div className="flex items-center gap-2">
        <div className={clsx("grid h-5 w-5 place-items-center rounded", iconClassName)}>
          <span className="block h-2 w-2 rounded-sm bg-current" />
        </div>
        <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
          {title}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
