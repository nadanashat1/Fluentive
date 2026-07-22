"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaignMock } from "@/data/marketing";
import { Button, Card, CardPad, H1, Input, Select, Sub } from "@/components/marketing/marketing.ui";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
      {children}
    </div>
  );
}

export function CreateCampaignView() {
  const router = useRouter();
  const [channel, setChannel] = useState<(typeof createCampaignMock.channels)[number]>("Facebook");
  const [name, setName] = useState("e.g. Q4 Executive Outreach");
  const [budget, setBudget] = useState("$0.00");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sourceName, setSourceName] = useState("UTM Source");
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const parseMoney = (v: string) => {
    const n = Number(String(v).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const parseDate = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return new Date().toISOString().slice(0, 10);
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <H1>Create New Campaign</H1>
        <Sub>Set up and track a new marketing campaign to optimize your outreach.</Sub>
      </div>

      <form
        className="grid gap-4 lg:grid-cols-[2fr_1fr]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (creating) return;
          setCreating(true);
          try {
            const res = await apiFetch<{ success: boolean; data: any }>("/api/marketing/campaigns", {
              method: "POST",
              body: JSON.stringify({
                name: name.trim() || "New Campaign",
                source: channel,
                description: notes.trim() || `Source: ${sourceName}`,
                budget: parseMoney(budget),
                startDate: parseDate(startDate),
                endDate: endDate.trim() ? parseDate(endDate) : null,
                status: "ACTIVE"
              })
            });

            showToast("Campaign created successfully!", "success");
            router.push("/marketing");
          } catch (error: any) {
            console.error(error);
            showToast(error?.message || "Failed to create campaign", "error");
            setCreating(false);
          }
        }}
      >
        <div className="space-y-4">
          <Card className="p-0">
            <CardPad>
              <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Basic Info</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Campaign Name *</Label>
                  <Input placeholder="e.g. Q4 Executive Outreach" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Channel</Label>
                  <Select value={channel} onChange={(e) => setChannel(e.target.value as any)}>
                    {createCampaignMock.channels.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardPad>
          </Card>

          <Card className="p-0">
            <CardPad>
              <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Tracking &amp; Notes</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Lead Source Name *</Label>
                  <Input placeholder="UTM Source" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
                </div>
                <div>
                  <Label>Expected Leads</Label>
                  <Input placeholder="500" defaultValue="500" />
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional campaign context..."
                    className="min-h-[96px] w-full resize-none rounded-soft border border-[#e1e3e9] bg-white px-3 py-2.5 text-[13px] text-[#2f3440] outline-none placeholder:text-[#a1a5b2] focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#840A36]"
                  />
                </div>
              </div>
            </CardPad>
          </Card>
        </div>

        <Card className="p-0 h-fit">
          <CardPad>
            <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Budget &amp; Dates</div>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Budget (USD) *</Label>
                <Input placeholder="$0.00" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input placeholder="mm/dd/yyyy" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input placeholder="mm/dd/yyyy" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button variant="primary" className="w-full" type="submit">
                Create Campaign ↗
              </Button>
              <Link href="/marketing" className="block">
                <Button className="w-full">Cancel</Button>
              </Link>
            </div>
          </CardPad>
        </Card>
      </form>
    </div>
  );
}
