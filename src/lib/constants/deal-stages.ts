// Central Deal Stage Constants
// Single source of truth for all DealStage usage
// Prevents future drift and human error

export const DEAL_STAGES = [
  'OPEN',
  'DISCOVERY',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST'
] as const;

export type DealStage = typeof DEAL_STAGES[number];

// Helper for safe stage validation
export function isValidDealStage(stage: string): stage is DealStage {
  return DEAL_STAGES.includes(stage as DealStage);
}
