import clsx from "clsx";
import { Lead } from "@/types";

const labels: Record<Lead["status"], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  LOST: "Lost",
  CONVERTED: "Converted"
};

export function StatusBadge({ status, className }: { status: Lead["status"]; className?: string }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "NEW" && "bg-[#fff2c7] text-[#97710a]",
        status === "CONTACTED" && "bg-[#d9e7ff] text-[#3057a6]",
        status === "QUALIFIED" && "bg-[#d7f4df] text-[#216637]",
        status === "LOST" && "bg-[#ffe0e0] text-[#9f3030]",
        status === "CONVERTED" && "bg-[#e0f2fe] text-[#0369a1]",
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
