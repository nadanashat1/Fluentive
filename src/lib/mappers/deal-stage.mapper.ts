// CRM Pipeline Stage Mapping
// Simplified mapping - Backend stages are source of truth
// Frontend uses visual labels for display only

export const STAGE_DISPLAY = {
  qualification: {
    label: 'Qualification',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  proposal: {
    label: 'Proposal',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  negotiation: {
    label: 'Negotiation',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100'
  },
  closed_won: {
    label: 'Closed Won',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  closed_lost: {
    label: 'Closed Lost',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100'
  },
  OPEN: {
    label: 'Open',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  WON: {
    label: 'Won',
    color: 'bg-green-500',
    textColor: 'text-green-700', 
    bgColor: 'bg-green-100'
  },
  LOST: {
    label: 'Lost',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100'
  }
} as const;

export type FrontendDealStage = keyof typeof STAGE_DISPLAY;

// Legacy helper used by pipeline UI. If backend stages are already frontend-shaped,
// return as-is; otherwise map coarse backend states to a sensible default.
export function mapBackendToFrontend(stage: string | null | undefined): FrontendDealStage {
  const s = String(stage || "").trim();
  if (!s) return "qualification";

  // Exact match (most common in UI)
  if (s in STAGE_DISPLAY) return s as FrontendDealStage;

  // Coarse backend states
  switch (s.toUpperCase()) {
    case "OPEN":
      return "qualification";
    case "WON":
      return "closed_won";
    case "LOST":
      return "closed_lost";
    default:
      return "qualification";
  }
}
