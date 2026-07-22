// Unified LeadStatus enum - single source of truth for both frontend and backend
export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED", 
  QUALIFIED: "QUALIFIED",
  CONVERTED: "CONVERTED",
  LOST: "LOST"
} as const;

export type LeadStatus = typeof LeadStatus[keyof typeof LeadStatus];

// Helper function to validate LeadStatus values
export function isValidLeadStatus(value: string): value is LeadStatus {
  if (!value || typeof value !== 'string') return false;
  return Object.values(LeadStatus).includes(value as LeadStatus);
}

// Helper function to convert frontend lowercase to backend uppercase
export function normalizeLeadStatus(status: string): LeadStatus {
  if (!status || typeof status !== 'string') {
    throw new Error(`Invalid LeadStatus: ${status}`);
  }
  const upperStatus = status.toUpperCase();
  if (isValidLeadStatus(upperStatus)) {
    return upperStatus;
  }
  throw new Error(`Invalid LeadStatus: ${status}`);
}
