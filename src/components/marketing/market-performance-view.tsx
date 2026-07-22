"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Plus } from "lucide-react";
import clsx from "clsx";
import { formatMoney } from "@/lib/format";
import { getAllCampaigns } from "@/lib/marketing-store";
import { Button, Card, CardPad, H1, Pill, Sub } from "@/components/marketing/marketing.ui";
import type { Campaign, CampaignStatus } from "@/types";

function RoiDelta({ value }: { value: number }) {
  const good = value >= 0;
  return (
    <span className={clsx("text-[11px] font-semibold", good ? "text-emerald-600" : "text-[#f25572]")}>
      {good ? "+" : ""}
      {value}%
    </span>
  );
}

function Kpi({
  title,
  value,
  delta,
  tone
}: {
  title: string;
  value: string;
  delta?: number;
  tone?: "neutral" | "good" | "bad" | "brand";
}) {
  return (
    <Card className="p-0">
      <CardPad>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">{title}</div>
        <div className="mt-2 text-[22px] font-bold text-[#202530] dark:text-gray-100">{value}</div>
        {typeof delta === "number" ? (
          <div className="mt-2">
            <Pill tone={tone ?? "neutral"}>
              <RoiDelta value={delta} />
            </Pill>
          </div>
        ) : null}
      </CardPad>
    </Card>
  );
}

function StatusPill({ status }: { status: CampaignStatus }) {
  if (status === "active") return <Pill tone="good">Active</Pill>;
  if (status === "completed") return <Pill tone="good">Completed</Pill>;
  if (status === "paused") return <Pill tone="neutral">Paused</Pill>;
  if (status === "draft") return <Pill tone="neutral">Draft</Pill>;
  if (status === "archived") return <Pill tone="neutral">Archived</Pill>;
  return <Pill tone="neutral">Unknown</Pill>;
}

export function MarketPerformanceView() {
  const [items, setItems] = useState<Campaign[]>([]);

  useEffect(() => {
    const sync = async () => {
      const campaigns = await getAllCampaigns();
      setItems(campaigns);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("marketing:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("marketing:changed", sync);
    };
  }, []);

  const campaigns = useMemo(() => items, [items]);
  const totals = useMemo(() => {
    const totalSpend = campaigns.reduce((s, c) => s + c.budget, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const overallRoi = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;
    const sortedByRoi = [...campaigns].sort((a, b) => b.roiPct - a.roiPct);
    const best = sortedByRoi[0];
    const worst = sortedByRoi[sortedByRoi.length - 1];
    return {
      totalSpend,
      totalRevenue,
      overallRoi,
      bestRoi: best?.roiPct ?? 0,
      worstRoi: worst?.roiPct ?? 0
    };
  }, [campaigns]);

  const impactBars = useMemo(() => {
    const list = campaigns.slice(0, 5);
    const maxRevenue = Math.max(1, ...list.map((c) => c.revenue));
    const maxSpend = Math.max(1, ...list.map((c) => c.budget));
    return list.map((c) => ({
      id: c.id,
      label: c.name.toUpperCase().slice(0, 12),
      revenue: Math.round((c.revenue / maxRevenue) * 92),
      spend: Math.round((c.budget / maxSpend) * 52)
    }));
  }, [campaigns]);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <H1>Market Performance</H1>
          <Sub>Real-time analysis of executive marketing spend and revenue orchestration across global channels.</Sub>
        </div>
        <Link href="/marketing/new">
          <Button variant="primary">
            New Campaign
            <Plus size={16} />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Kpi title="Total Spend" value={formatMoney(totals.totalSpend)} />
        <Kpi title="Total Revenue" value={formatMoney(totals.totalRevenue)} />
        <Kpi title="Overall ROI" value={`${totals.overallRoi}%`} />
        <Kpi title="Best ROI" value={`${totals.bestRoi}%`} />
        <Kpi title="Worst ROI" value={`${totals.worstRoi}%`} />
      </div>

      <Card className="p-0">
        <CardPad className="pb-4">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Campaign Impact Analysis</div>
          <div className="mt-1 text-[12px] text-[#9aa0ad]">Revenue vs Spend</div>
        </CardPad>
        <div className="px-5 pb-5">
          <div className="rounded-lg2 border border-[#eef0f4] bg-[#fbfbfd] p-5 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
            <div className="mb-4 flex items-center justify-end gap-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Revenue
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#e5e7eb] dark:bg-white/15" /> Spend
              </span>
            </div>
            <div className="flex h-[220px] items-end justify-between gap-4">
              {impactBars.map((b) => (
                <div key={b.id} className="flex w-full flex-col items-center justify-end gap-3">
                  <div className="flex w-full items-end justify-center gap-2">
                    <div className="w-10 rounded-t-lg2 bg-[#e5e7eb] dark:bg-white/15" style={{ height: `${b.spend * 2}px` }} />
                    <div className="w-10 rounded-t-lg2 bg-brand" style={{ height: `${b.revenue * 2}px` }} />
                  </div>
                  <div className="text-[10px] font-semibold text-[#9aa0ad]">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <CardPad className="pb-3">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Campaigns Performance Analysis</div>
        </CardPad>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed">
            <thead className="bg-[#fafafd] text-left dark:bg-[#0f0820]">
              <tr>
                <th className="w-[22%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Campaign Name
                </th>
                <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Channel
                </th>
                <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Budget ($)
                </th>
                <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Leads
                </th>
                <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Sales
                </th>
                <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Revenue ($)
                </th>
                <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  CPL
                </th>
                <th className="w-[8%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  ROI
                </th>
                <th className="w-[8%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[#eef0f4] transition-colors hover:bg-[#fafbfd] dark:border-[#2a2f3a] dark:hover:bg-[#0f0820]"
                >
                  <td className="px-5 py-4">
                    <Link href={`/marketing/${c.id}`} className="text-[13px] font-semibold text-[#2f3440] hover:underline dark:text-gray-100">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#646b7a] dark:text-gray-300">{c.channel}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{formatMoney(c.budget)}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{c.leads.toLocaleString()}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{c.sales.toLocaleString()}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{formatMoney(c.revenue)}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#646b7a] dark:text-gray-300">${c.cpl.toFixed(2)}</td>
                  <td className={clsx("px-5 py-4 text-[12px] font-semibold", c.roiPct >= 0 ? "text-emerald-600" : "text-[#f25572]")}>
                    {c.roiPct}%
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 text-[11px] text-[#9aa0ad]">
          <span className="inline-flex items-center gap-2">
            <BarChart3 size={14} className="text-brand" />
            {campaigns.length} campaigns
          </span>
          <span>Updated just now</span>
        </div>
      </Card>
    </div>
  );
}
