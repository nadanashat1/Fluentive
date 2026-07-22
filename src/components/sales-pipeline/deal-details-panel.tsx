import { Deal } from "@/types";
import { X, Clock, DollarSign, Calendar } from "lucide-react";
import { Timeline } from "./timeline";
import { ClientInfo } from "./client-info";
import { SalesAgentInfo } from "./sales-agent-info";
import { InternalNotes } from "./internal-notes";
import { ActionButtons } from "./action-buttons";

interface DealDetailsPanelProps {
  deal: Deal;
  onClose: () => void;
}

import { STAGE_DISPLAY } from '@/lib/mappers/deal-stage.mapper';

const stageColors = {
  OPEN: STAGE_DISPLAY.OPEN.bgColor,
  WON: STAGE_DISPLAY.WON.bgColor,
  LOST: STAGE_DISPLAY.LOST.bgColor
} as const;

const stageLabels = {
  OPEN: STAGE_DISPLAY.OPEN.label,
  WON: STAGE_DISPLAY.WON.label,
  LOST: STAGE_DISPLAY.LOST.label
} as const;

export function DealDetailsPanel({ deal, onClose }: DealDetailsPanelProps) {
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0
  }).format(deal.dealValue);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] border-l border-[#ececef] bg-white shadow-xl dark:border-[#2a2f3a] dark:bg-[#0b0614] lg:w-[450px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ececef] px-5 py-4 dark:border-[#2a2f3a]">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1f2430] dark:text-gray-100">
            Deal Details
          </h2>
          <p className="text-[12px] text-[#707483] dark:text-gray-400">
            {deal.clientName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-[#707483] transition-colors hover:bg-[#f6f6f8] dark:text-gray-400 dark:hover:bg-[#1a0b2e]"
          title="Close deal details"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100%-73px)] flex-col overflow-y-auto">
        {/* Deal Info */}
        <div className="border-b border-[#ececef] px-5 py-4 dark:border-[#2a2f3a]">
          <div className={`px-6 py-4 rounded-t-lg ${stageColors[deal.stage]}`}>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${stageColors[deal.stage]}`}>
                {stageLabels[deal.stage]}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#707483] dark:text-gray-400">
                <Clock size={14} />
                <span>{deal.probability}% probability</span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-brand" />
            <span className="text-[24px] font-semibold text-[#1f2430] dark:text-gray-100">
              {formattedValue}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[#707483] dark:text-gray-400">
              <Calendar size={14} />
              <span>Created: {formatDate(deal.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#707483] dark:text-gray-400">
              <Calendar size={14} />
              <span>Expected Close: {formatDate(deal.expectedCloseDate)}</span>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <ClientInfo deal={deal} />

        {/* Sales Agent Information */}
        <SalesAgentInfo deal={deal} />

        {/* Timeline */}
        <div className="border-b border-[#ececef] px-5 py-4 dark:border-[#2a2f3a]">
          <h3 className="mb-3 text-[13px] font-semibold text-[#1f2430] dark:text-gray-100">
            Activity Timeline
          </h3>
          <Timeline events={deal.timeline || []} />
        </div>

        {/* Internal Notes */}
        <InternalNotes notes={deal.notes?.map(note => note.content) || []} />

        {/* Action Buttons */}
        <div className="border-t border-[#ececef] px-5 py-4 dark:border-[#2a2f3a]">
          <ActionButtons deal={deal} />
        </div>
      </div>
    </div>
  );
}
