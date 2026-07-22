// Single Source of Truth for All Enums
// NO MORE MIXING "new" vs "NEW" - ONE CANONICAL SOURCE

export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED", 
  QUALIFIED: "QUALIFIED",
  CONVERTED: "CONVERTED",
  LOST: "LOST"
} as const;

export type LeadStatus = typeof LeadStatus[keyof typeof LeadStatus];

export const DealStage = {
  OPEN: "OPEN",
  WON: "WON", 
  LOST: "LOST"
} as const;

export type DealStage = typeof DealStage[keyof typeof DealStage];



export const DealStageHelpers = {
  isValid: (value: string): value is DealStage => {
    if (!value || typeof value !== 'string') return false;
    return Object.values(DealStage).includes(value as DealStage);
  },
  
  fromString: (value: string): DealStage => {
    if (DealStageHelpers.isValid(value)) {
      return value as DealStage;
    }
    throw new Error(`Invalid DealStage: ${value}`);
  }
};

// NEVER use string literals anymore - ALWAYS use these constants
// ❌ WRONG: status === "new" 
// ✅ RIGHT: status === LeadStatus.NEW
