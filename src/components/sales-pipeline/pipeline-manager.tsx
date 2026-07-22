import { Deal, DealStage } from "@/types";
import { DealCard } from "./deal-card";
import { Plus } from "lucide-react";

interface PipelineManagerProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  selectedDealId: string | undefined;
  onAddDeal?: () => void;
}

import { STAGE_DISPLAY } from '@/lib/mappers/deal-stage.mapper';

const stages: { key: DealStage; label: string; color: string }[] = [
  { key: "OPEN" as DealStage, label: STAGE_DISPLAY.OPEN.label, color: STAGE_DISPLAY.OPEN.color },
  { key: "WON" as DealStage, label: STAGE_DISPLAY.WON.label, color: STAGE_DISPLAY.WON.color },
  { key: "LOST" as DealStage, label: STAGE_DISPLAY.LOST.label, color: STAGE_DISPLAY.LOST.color }
];

export function PipelineManager({
  deals,
  onDealClick,
  selectedDealId,
  onAddDeal
}: PipelineManagerProps) {
  const getDealsByStage = (stage: DealStage) => {
    if (stage === "WON" || stage === "LOST") {
      return deals.filter((d) => d.stage === stage);
    }
    return deals.filter((d) => d.stage === "OPEN");
  };

  const getStageTotal = (stage: DealStage) => {
    return getDealsByStage(stage).reduce(
      (total, deal) => total + deal.dealValue,
      0
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex-1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#1f2430] dark:text-gray-100">
          Pipeline Manager
        </h2>
        <button
          type="button"
          onClick={onAddDeal}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition hover:bg-brand-dark"
        >
          <Plus size={16} />
          <span>Add Deal</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.key);
          const stageTotal = getStageTotal(stage.key);

          return (
            <div
              key={stage.key}
              className="flex min-w-[280px] flex-1 flex-col rounded-xl border border-[#e6e7eb] bg-[#f8f9fc] dark:border-[#2a2f3a] dark:bg-[#0f0820]"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between border-b border-[#e6e7eb] px-4 py-3 dark:border-[#2a2f3a]">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                  <h3 className="text-[13px] font-semibold text-[#1f2430] dark:text-gray-100">
                    {stage.label}
                  </h3>
                  <span className="rounded-full bg-[#e6e7eb] px-2 py-0.5 text-[11px] font-medium text-[#707483] dark:bg-[#2a2f3a] dark:text-gray-400">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-[12px] font-medium text-[#707483] dark:text-gray-400">
                  {formatCurrency(stageTotal)}
                </span>
              </div>

              {/* Deals List */}
              <div className="flex-1 space-y-3 overflow-y-auto p-3 scrollbar-thin">
                {stageDeals.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-[12px] text-[#707483] dark:text-gray-400">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onClick={() => onDealClick(deal)}
                      isSelected={selectedDealId === deal.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
