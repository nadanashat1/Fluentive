"use client";

import { campaigns as seedCampaigns } from "@/data/marketing";
import type { Campaign, CampaignStatus } from "@/types";

const STORAGE_KEY = "fluentive.marketing.campaigns.v2";

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("marketing:changed"));
  }
}

function parseList(raw: string | null): Campaign[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Campaign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStored(): Campaign[] {
  if (typeof window === "undefined") return [];
  return parseList(window.localStorage.getItem(STORAGE_KEY));
}

function writeStored(list: Campaign[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  emitChange();
}

function normalizeStatus(input: string): CampaignStatus {
  if (input === 'active' || input === 'paused' || input === 'draft' || input === 'completed' || input === 'archived') {
    return input;
  }
  return 'draft';
}

function toCampaign(input: Campaign): Campaign {
  const budget = Number.isFinite(input.budget) ? Math.max(0, input.budget) : 0;
  const leads = Number.isFinite(input.leads) ? Math.max(0, Math.round(input.leads)) : 0;
  const sales = Number.isFinite(input.sales) ? Math.max(0, Math.round(input.sales)) : 0;
  const revenue = Number.isFinite(input.revenue) ? Math.max(0, Math.round(input.revenue)) : 0;
  const cpl = leads > 0 ? budget / leads : 0;
  const roiPct = budget > 0 ? Math.round(((revenue - budget) / budget) * 100) : 0;

  return {
    ...input,
    budget,
    leads,
    sales,
    revenue,
    cpl: Math.round(cpl * 100) / 100,
    roiPct,
    status: normalizeStatus(input.status)
  };
}

export function getAllCampaigns(): Campaign[] {
  const stored = readStored();
  const byId = new Map<string, Campaign>();
  [...seedCampaigns, ...stored].forEach((c) => {
    byId.set(c.id, toCampaign(c));
  });
  return Array.from(byId.values());
}

export function getCampaignById(id: string): Campaign | null {
  return getAllCampaigns().find((c) => c.id === id) ?? null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function createCampaign(input: {
  name: string;
  channel: string;
  budget: number;
  startDate: string;
  endDate?: string | null;
}): Campaign {
  const safeBudget = Math.max(100, Math.round(input.budget || 0));
  const leads = Math.max(40, Math.round(safeBudget * 0.09));
  const sales = Math.max(6, Math.round(leads * 0.19));
  const revenue = Math.round(sales * 170);
  const idBase = slugify(input.name) || "campaign";
  const id = `${idBase}-${Date.now().toString(36).slice(-5)}`;

  return toCampaign({
    id,
    name: input.name || "New Campaign",
    channel: input.channel || "Facebook",
    budget: safeBudget,
    leads,
    sales,
    revenue,
    cpl: 0,
    roiPct: 0,
    status: "active" as any,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    createdBy: "Eslam Hendy"
  });
}

export function upsertCampaign(campaign: Campaign) {
  const next = readStored().filter((c) => c.id !== campaign.id);
  next.unshift(toCampaign(campaign));
  writeStored(next);
}

export function updateCampaignStatus(id: string, status: CampaignStatus): Campaign | null {
  const existing = getCampaignById(id);
  if (!existing) return null;
  const updated = { ...existing, status };
  upsertCampaign(updated);
  return updated;
}

export function updateCampaign(
  id: string,
  patch: Partial<Pick<Campaign, "name" | "channel" | "budget" | "startDate" | "endDate" | "status">>
): Campaign | null {
  const existing = getCampaignById(id);
  if (!existing) return null;
  const updated: Campaign = toCampaign({
    ...existing,
    ...patch,
    status: patch.status ? normalizeStatus(patch.status) : existing.status
  });
  upsertCampaign(updated);
  return updated;
}
