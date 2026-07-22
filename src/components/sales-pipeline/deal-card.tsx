import { Deal } from "@/types";
import { Calendar, Clock, DollarSign, User } from "lucide-react";
import clsx from "clsx";

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  isSelected: boolean;
}

const stageColors = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
};

const stageLabels = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost"
};

export function DealCard({ deal, onClick, isSelected }: DealCardProps) {
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0
  }).format(deal.dealValue);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        "cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-[#1a0b2e]",
        isSelected
          ? "border-brand ring-1 ring-brand dark:ring-brand"
          : "border-[#e6e7eb] dark:border-[#2a2f3a]"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-[14px] font-semibold text-[#1f2430] dark:text-gray-100">
            {deal.clientName}
          </h3>
          <p className="mt-0.5 text-[12px] text-[#707483] dark:text-gray-400">
            {deal.clientCompany}
          </p>
        </div>
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            deal.stage && stageColors[deal.stage as keyof typeof stageColors]
          )}
        >
          {stageLabels[deal.stage]}
        </span>
      </div>

      {/* Deal Value */}
      <div className="mb-3 flex items-center gap-2">
        <DollarSign size={14} className="text-[#707483] dark:text-gray-400" />
        <span className="text-[15px] font-semibold text-[#1f2430] dark:text-gray-100">
          {formattedValue}
        </span>
      </div>

      {/* Sales Agent */}
      <div className="mb-3 flex items-center gap-2">
        <User size={14} className="text-[#707483] dark:text-gray-400" />
        <span className="text-[12px] text-[#707483] dark:text-gray-400">
          {deal.salesAgent.name}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#ececef] pt-3 dark:border-[#2a2f3a]">
        <div className="flex items-center gap-1.5 text-[11px] text-[#707483] dark:text-gray-400">
          <Calendar size={12} />
          <span>Due {formatDate(deal.expectedCloseDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#707483] dark:text-gray-400">
          <Clock size={12} />
          <span>{deal.probability}%</span>
        </div>
      </div>
    </div>
  );
}
