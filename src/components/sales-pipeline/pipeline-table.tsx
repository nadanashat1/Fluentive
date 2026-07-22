import { Deal } from "@/types";
import clsx from "clsx";

interface PipelineTableProps {
  deals: Deal[];
  onRowClick: (deal: Deal) => void;
}

import { STAGE_DISPLAY, mapBackendToFrontend } from '@/lib/mappers/deal-stage.mapper';

const stagePill = {
  qualification: STAGE_DISPLAY.qualification.color,
  proposal: STAGE_DISPLAY.proposal.color,
  negotiation: STAGE_DISPLAY.negotiation.color,
  closed_won: STAGE_DISPLAY.closed_won.color,
  closed_lost: STAGE_DISPLAY.closed_lost.color
} as const;

const stageLabel = {
  qualification: STAGE_DISPLAY.qualification.label,
  proposal: STAGE_DISPLAY.proposal.label,
  negotiation: STAGE_DISPLAY.negotiation.label,
  closed_won: STAGE_DISPLAY.closed_won.label,
  closed_lost: STAGE_DISPLAY.closed_lost.label
} as const;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0
  }).format(value);
}

function formatTableDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function PipelineTable({ deals, onRowClick }: PipelineTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#ececef] bg-white dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-[#fafafd] text-left dark:bg-[#0f0820]">
            <th className="w-[26%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa0ad]">
              Client
            </th>
            <th className="w-[22%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa0ad]">
              Course
            </th>
            <th className="w-[14%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa0ad]">
              Value
            </th>
            <th className="w-[16%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa0ad]">
              Stage
            </th>
            <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa0ad]">
              Agent
            </th>
            <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa0ad]">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.id}
              onClick={() => onRowClick(deal)}
              className="group cursor-pointer border-t border-[#eef0f4] transition-colors hover:bg-[#fafbfd] dark:border-[#1f2230] dark:hover:bg-[#0f0820]"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-brand-dark" />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-[#2f3440] dark:text-gray-100">
                      {deal.clientName}
                    </div>
                    <div className="truncate text-[10.5px] text-[#9aa0ad]">
                      {deal.clientCompany}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="text-[12px] font-medium text-[#2f3440] dark:text-gray-100">
                  {deal.course}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
                  {formatMoney(deal.dealValue)}
                </div>
              </td>
              <td className="px-5 py-4">
                <span
                  className={clsx(
                    "inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
                    STAGE_DISPLAY[mapBackendToFrontend(deal.stage) as keyof typeof STAGE_DISPLAY]?.color || STAGE_DISPLAY.qualification.color
                  )}
                >
                  {STAGE_DISPLAY[mapBackendToFrontend(deal.stage) as keyof typeof STAGE_DISPLAY]?.label || 'Qualification'}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#111827]" />
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold text-[#2f3440] dark:text-gray-100">
                      {deal.salesAgent.name.split(" ")[0]}
                    </div>
                    <div className="truncate text-[10px] text-[#9aa0ad]">Agent</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="text-[11px] font-medium text-[#9aa0ad]">
                  {formatTableDate(deal.date)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
