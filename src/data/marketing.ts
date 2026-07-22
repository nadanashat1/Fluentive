import type { Campaign } from "@/types";

export const campaigns: Campaign[] = [
  {
    id: "summer-sale-q3",
    name: "Summer Sale Q3",
    channel: "Facebook",
    budget: 25_000,
    leads: 2410,
    sales: 820,
    revenue: 84_200,
    cpl: 10.37,
    roiPct: 237,
    status: "active",
    startDate: "2026-07-01",
    endDate: null,
    createdBy: "Eslam Hendy"
  }
];

export const createCampaignMock = {
  channels: ["Facebook", "Google", "Social", "Email"] as const
};
