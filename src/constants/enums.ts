/**
 * ENTERPRISE CANONICAL ENUMS
 * Use these instead of raw strings to prevent frontend/backend mismatch.
 */

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  LOST = 'LOST',
  CONVERTED = 'CONVERTED'
}

export enum DealStage {
  DISCOVERY = 'DISCOVERY',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CONTRACT_SENT = 'CONTRACT_SENT',
  WON = 'WON',
  LOST = 'LOST'
}

export enum CandidateStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  HR_INTERVIEW = 'HR_INTERVIEW',
  TECHNICAL_INTERVIEW = 'TECHNICAL_INTERVIEW',
  ASSESSMENT = 'ASSESSMENT',
  OFFERED = 'OFFERED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED'
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum ActivityType {
  SYSTEM = 'SYSTEM',
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  SECURITY = 'SECURITY'
}
