// Domain Types - Business Model Contracts
import { LeadStatus, DealStage } from '@prisma/client';
import { Roles, RoleType } from '@/constants/roles';

export { LeadStatus, DealStage };

export interface DomainUser {
  id: string;
  workspaceId: string;
  role: RoleType;
  permissions: Permission[];
}

export interface DomainLead {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainDeal {
  id: string;
  workspaceId: string;
  ownerId: string;
  leadId: string;
  title: string;
  value: number;
  stage: DealStage;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainActivity {
  id: string;
  workspaceId: string;
  userId: string;
  leadId?: string;
  dealId?: string;
  aggregateId?: string;
  type: ActivityType;
  description: string;
  createdAt: Date;
}



export enum Permission {
  READ_LEADS = 'READ_LEADS',
  WRITE_LEADS = 'WRITE_LEADS',
  DELETE_LEADS = 'DELETE_LEADS',
  READ_DEALS = 'READ_DEALS',
  WRITE_DEALS = 'WRITE_DEALS',
  DELETE_DEALS = 'DELETE_DEALS',
  CONVERT_LEADS = 'CONVERT_LEADS',
  MANAGE_USERS = 'MANAGE_USERS'
}

export enum ActivityType {
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  LEAD_CONVERTED = 'LEAD_CONVERTED',
  DEAL_CREATED = 'DEAL_CREATED',
  DEAL_UPDATED = 'DEAL_UPDATED',
  DEAL_WON = 'DEAL_WON',
  DEAL_LOST = 'DEAL_LOST',
  NOTE_ADDED = 'NOTE_ADDED',
  CALL_LOGGED = 'CALL_LOGGED',
  EMAIL_SENT = 'EMAIL_SENT'
}

// Domain Events - Event Sourcing Foundation
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: 'Lead' | 'Deal' | 'User' | 'Activity';
  data: any;
  timestamp: Date;
  userId: string;
  workspaceId: string;
}

// Business Rules - Domain Invariants
export interface BusinessRule {
  name: string;
  description: string;
  validate: (context: any) => RuleResult;
}

export interface RuleResult {
  isValid: boolean;
  error?: string;
  code?: string;
}

// Value Objects - Domain Concepts
export interface Email {
  value: string;
  isValid: boolean;
}

export interface PhoneNumber {
  value: string;
  isValid: boolean;
}

export interface Money {
  amount: number;
  currency: string;
}
