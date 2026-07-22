"use client";

import { useMemo, useState } from "react";
import { Deal } from "@/types";
import { PipelineTabs, PipelineTabKey } from "./pipeline-tabs";
import { PipelineTable } from "./pipeline-table";

interface PipelineManagerCardProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export function PipelineManagerCard({ deals, onDealClick }: PipelineManagerCardProps) {
  const [tab, setTab] = useState<PipelineTabKey>("all");

  const filteredDeals = useMemo(() => {
    if (tab === "all") return deals;
    if (tab === "active") {
      return deals.filter(
        (d) => d.stage !== "WON" && d.stage !== "LOST"
      );
    }
    return deals.filter((d) => d.stage === "WON" || d.stage === "LOST");
  }, [deals, tab]);

  return (
    <div className="rounded-xl border border-[#ececef] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#2f3440] dark:text-gray-100">
            Pipeline Manager
          </h2>
          <p className="mt-1 text-[11px] text-[#9aa0ad] dark:text-gray-400">
            Visualizing 24 active high-value opportunities
          </p>
        </div>

        <PipelineTabs value={tab} onChange={setTab} />
      </div>

      <div className="mt-4">
        <PipelineTable deals={filteredDeals} onRowClick={onDealClick} />
      </div>
    </div>
  );
}
