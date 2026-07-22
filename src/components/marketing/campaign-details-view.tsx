"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { CalendarDays, Edit3, Pause, Play, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { Button, Card, CardPad, H1, Pill, Sub } from "@/components/marketing/marketing.ui";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

function DeltaPill({ value }: { value: number }) {
  const good = value >= 0;
  return (
    <Pill tone={good ? "good" : "bad"}>
      <span className={clsx("text-[11px] font-semibold", good ? "text-emerald-600" : "text-[#f25572]")}>
        {good ? "+" : ""}
        {value}%
      </span>
    </Pill>
  );
}

function Metric({
  title,
  value,
  delta,
  icon
}: {
  title: string;
  value: string;
  delta?: number;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <CardPad>
        <div className="flex items-start justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">{title}</div>
          {icon ? (
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f7edf2] text-brand dark:bg-brand/20">
              {icon}
            </div>
          ) : null}
        </div>
        <div className="mt-2 text-[22px] font-bold text-[#202530] dark:text-gray-100">{value}</div>
        {typeof delta === "number" ? <div className="mt-2"><DeltaPill value={delta} /></div> : null}
      </CardPad>
    </Card>
  );
}

export function CampaignDetailsView({ id }: { id: string }) {
  const [campaign, setCampaign] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editChannel, setEditChannel] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; data: any }>(`/api/marketing/campaigns/${id}`);
      if (res.success && res.data) {
        setCampaign(res.data);
      }
    } catch (error) {
      console.error("Failed to load campaign", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaign();
  }, [id]);

  useEffect(() => {
    if (!campaign) return;
    if (!editing) return;
    setEditName(campaign.name);
    setEditChannel(campaign.channel);
    setEditBudget(String(campaign.budget));
    setEditStart(campaign.startDate || "");
    setEditEnd(campaign.endDate || "");
  }, [editing, campaign]);

  const rand = useMemo(() => {
    // deterministic pseudo-random from id
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const a = (h >>> 0) / 2 ** 32;
    const b = ((h ^ 0x9e3779b9) >>> 0) / 2 ** 32;
    return { a, b };
  }, [id]);

  const d = useMemo(() => {
    if (!campaign) return null;

    const started = new Date(campaign.startDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    const conversionRatePct = campaign.leads > 0 ? (campaign.sales / campaign.leads) * 100 : 0;
    const spend = Math.round(campaign.budget * (0.42 + rand.a * 0.22));
    const revenue = campaign.revenue;

    return {
      breadcrumbs: ["Marketing", "Campaigns", campaign.name],
      spend,
      revenue,
      roiPct: campaign.roiPct,
      roiDeltaPct: campaign.roiPct >= 0 ? Math.round(4 + rand.b * 6) : -Math.round(4 + rand.b * 6),
      leads: campaign.leads,
      leadsDeltaPct: campaign.leads >= 1500 ? Math.round(6 + rand.b * 6) : Math.round(2 + rand.b * 4),
      sales: campaign.sales,
      salesDeltaPct: campaign.sales >= 100 ? Math.round(2 + rand.a * 4) : Math.round(1 + rand.a * 3),
      conversionRatePct,
      conversionRateDeltaPct: campaign.roiPct >= 0 ? 1.4 + rand.a * 1.6 : -(1.4 + rand.a * 1.6),
      budget: campaign.budget,
      channel: `${campaign.channel} Ads`,
      started
    };
  }, [campaign, rand.a, rand.b]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-40" />
        <div className="grid gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-7 w-24" />
            </div>
          ))}
        </div>
        <div className="skeleton h-[220px] w-full rounded-lg2" />
        <div className="skeleton h-[160px] w-full rounded-lg2" />
      </div>
    );
  }

  if (!d) {
    return notFound();
  }

  const conv = useMemo(() => {
    const leadsGenerated = d.leads;
    const contacted = Math.max(0, Math.round(leadsGenerated * 0.76));
    const salesClosed = d.sales;
    return { leadsGenerated, contacted, salesClosed };
  }, [d.leads, d.sales]);

  const segments = useMemo(() => {
    const spendTotal = d.spend;
    const leadsTotal = d.leads;
    const salesTotal = d.sales;
    const revTotal = d.revenue;

    const s1Spend = Math.round(spendTotal * (0.34 + rand.a * 0.1));
    const s2Spend = Math.round(spendTotal * (0.26 + rand.b * 0.08));
    const s3Spend = Math.max(0, spendTotal - s1Spend - s2Spend);

    const s1Leads = Math.round(leadsTotal * 0.38);
    const s2Leads = Math.round(leadsTotal * 0.22);
    const s3Leads = Math.max(0, leadsTotal - s1Leads - s2Leads);

    const s1Sales = Math.round(salesTotal * 0.41);
    const s2Sales = Math.round(salesTotal * 0.26);
    const s3Sales = Math.max(0, salesTotal - s1Sales - s2Sales);

    const s1Rev = Math.round(revTotal * 0.46);
    const s2Rev = Math.round(revTotal * 0.31);
    const s3Rev = Math.max(0, revTotal - s1Rev - s2Rev);

    const roi = (rev: number, spend: number) => Math.round(((rev - spend) / Math.max(1, spend)) * 100);

    return [
      { id: "seg-1", segment: `Lookalike (${Math.round(2 + rand.a * 4)}%)`, spend: s1Spend, leads: s1Leads, sales: s1Sales, revenue: s1Rev, roiPct: roi(s1Rev, s1Spend) },
      { id: "seg-2", segment: `Retargeting V${Math.round(2 + rand.b * 3)}`, spend: s2Spend, leads: s2Leads, sales: s2Sales, revenue: s2Rev, roiPct: roi(s2Rev, s2Spend) },
      { id: "seg-3", segment: "Interest: Luxury", spend: s3Spend, leads: s3Leads, sales: s3Sales, revenue: s3Rev, roiPct: roi(s3Rev, s3Spend) }
    ];
  }, [d.spend, d.leads, d.sales, d.revenue, rand.a, rand.b]);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
            {d.breadcrumbs.join("  •  ").toUpperCase()}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <H1>{d.breadcrumbs[d.breadcrumbs.length - 1]}</H1>
            <Pill tone="brand">SUMMER SALE</Pill>
            <Pill tone="brand">Q3</Pill>
            <Pill tone="brand">2026</Pill>
          </div>
          <Sub>
            Channel: <span className="font-semibold text-[#2f3440] dark:text-gray-200">{d.channel}</span> • Started:{" "}
            <span className="font-semibold text-[#2f3440] dark:text-gray-200">{d.started}</span>
          </Sub>
        </div>

        <div className="flex flex-wrap gap-2">
          <Card className="px-4 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Total Budget</div>
            <div className="mt-1 text-[13px] font-bold text-[#2f3440] dark:text-gray-100">{formatMoney(d.budget)}</div>
          </Card>
          <Button
            onClick={async () => {
              if (!campaign) return;
              const nextStatus = campaign.status === "PAUSED" ? "ACTIVE" : "PAUSED";
              try {
                await apiFetch(`/api/marketing/campaigns/${campaign.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: nextStatus })
                });
                setCampaign({ ...campaign, status: nextStatus });
                showToast(`Campaign ${nextStatus.toLowerCase()}`, "success");
              } catch (err: any) {
                showToast(err?.message || "Failed to update status", "error");
              }
            }}
          >
            {campaign?.status === "PAUSED" ? <Play size={16} /> : <Pause size={16} />}
            {campaign?.status === "PAUSED" ? "Resume" : "Pause"}
          </Button>
          <Button
            onClick={() => {
              if (!campaign) return;
              setEditing(true);
            }}
          >
            <Edit3 size={16} /> Edit Campaign
          </Button>
        </div>
      </div>

      {editing && campaign && (
        <Card className="p-0">
          <CardPad>
            <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Edit Campaign</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Campaign name"
                className="h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
              />
              <input
                value={editChannel}
                onChange={(e) => setEditChannel(e.target.value)}
                placeholder="Channel"
                className="h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
              />
              <input
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                placeholder="Budget"
                className="h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
              />
              <input
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                placeholder="Start Date"
                className="h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
              />
              <input
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                placeholder="End Date"
                className="h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                onClick={async () => {
                  const parsedBudget = Number(String(editBudget).replace(/[^0-9.]/g, ""));
                  const updates = {
                    name: editName.trim() || campaign.name,
                    source: editChannel.trim() || campaign.channel,
                    budget: Number.isFinite(parsedBudget) ? parsedBudget : campaign.budget,
                    startDate: editStart.trim() || campaign.startDate,
                    endDate: editEnd.trim() || null
                  };
                  try {
                    const res = await apiFetch<{ data: any }>(`/api/marketing/campaigns/${campaign.id}`, {
                      method: "PATCH",
                      body: JSON.stringify(updates)
                    });
                    if (res.data) setCampaign(res.data);
                    showToast("Campaign updated", "success");
                    setEditing(false);
                  } catch (err: any) {
                    showToast(err?.message || "Failed to update campaign", "error");
                  }
                }}
              >
                Save
              </Button>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </CardPad>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Metric title="Total Spend" value={formatMoney(d.spend)} delta={-4} icon={<CalendarDays size={18} />} />
        <Metric title="Total Revenue" value={formatMoney(d.revenue)} delta={12} />
        <Metric title="ROI" value={`${d.roiPct}%`} delta={d.roiDeltaPct} />
        <Metric title="Leads" value={d.leads.toLocaleString()} delta={d.leadsDeltaPct} />
        <Metric title="Conv. Rate" value={`${d.conversionRatePct.toFixed(1)}%`} delta={d.conversionRateDeltaPct} />
      </div>

      <Card className="p-0">
        <CardPad className="pb-4">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Spend vs Revenue Performance</div>
        </CardPad>
        <div className="px-5 pb-5">
          <div className="h-[220px] overflow-hidden rounded-lg2 border border-[#eef0f4] bg-[#fbfbfd] dark:border-[#2a2f3a] dark:bg-[#0f0820]">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-brand/10 to-transparent" />
              <svg viewBox="0 0 700 240" className="absolute inset-0 h-full w-full">
                <path
                  d="M10,205 C80,190 110,160 170,170 C220,178 260,150 310,140 C360,130 390,150 440,120 C510,80 560,70 610,85 C640,95 670,90 690,80"
                  fill="none"
                  stroke="#8b0b45"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-semibold text-[#9aa0ad]">
                {["JAN", "MAR", "MAY", "JUL", "SEP", "NOV", "JAN"].map((m, i) => (
                  <span key={`${m}-${i}`}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <CardPad className="pb-4">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Campaign Conversion Funnel</div>
        </CardPad>
        <div className="px-5 pb-5">
          <div className="grid gap-4 rounded-lg2 border border-[#eef0f4] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#0f0820] md:grid-cols-3">
            <div className="rounded-lg2 border border-[#eef0f4] bg-[#fbfbfd] p-4 dark:border-[#2a2f3a] dark:bg-[#0b0614]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Leads Generated</div>
              <div className="mt-2 text-[22px] font-bold text-brand">{conv.leadsGenerated.toLocaleString()}</div>
            </div>
            <div className="rounded-lg2 border border-[#eef0f4] bg-[#fbfbfd] p-4 dark:border-[#2a2f3a] dark:bg-[#0b0614]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Contacted</div>
              <div className="mt-2 text-[22px] font-bold text-[#2f3440] dark:text-gray-100">{conv.contacted.toLocaleString()}</div>
            </div>
            <div className="rounded-lg2 border border-[#eef0f4] bg-[#fbfbfd] p-4 dark:border-[#2a2f3a] dark:bg-[#0b0614]">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Sales Closed</div>
                <Pill tone="good">SUCCESS</Pill>
              </div>
              <div className="mt-2 text-[22px] font-bold text-[#2f3440] dark:text-gray-100">{conv.salesClosed.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <CardPad className="pb-3">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Segment Performance</div>
        </CardPad>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed">
            <thead className="bg-[#fafafd] text-left dark:bg-[#0f0820]">
              <tr>
                <th className="w-[26%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Segment</th>
                <th className="w-[14%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Spend</th>
                <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Leads</th>
                <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Sales</th>
                <th className="w-[16%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Revenue</th>
                <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">ROI</th>
                <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Status</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => (
                <tr key={s.id} className="border-t border-[#eef0f4] dark:border-[#2a2f3a]">
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#2f3440] dark:text-gray-100">{s.segment}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{formatMoney(s.spend)}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{s.leads.toLocaleString()}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{s.sales.toLocaleString()}</td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{formatMoney(s.revenue)}</td>
                  <td className={clsx("px-5 py-4 text-[12px] font-semibold", s.roiPct >= 0 ? "text-emerald-600" : "text-[#f25572]")}>
                    {s.roiPct}%
                  </td>
                  <td className="px-5 py-4">
                    <Pill tone="good">Active</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-between">
        <Link href="/marketing">
          <Button>
            <Play size={16} />
            Back
          </Button>
        </Link>
        <Link href="/marketing/new">
          <Button variant="primary">
            <Plus size={16} />
            Create New
          </Button>
        </Link>
      </div>
    </div>
  );
}
