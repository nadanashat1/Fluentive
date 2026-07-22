// DOMAIN LAYER: Repository Contracts
// These interfaces define WHAT the domain needs, not HOW it's implemented

import { LeadStatus } from '@/types/LeadStatus';

export interface ILeadRepository {
  create(data: CreateLeadData): Promise<Lead>;
  findById(id: string): Promise<Lead | null>;
  findByEmail(email: string): Promise<Lead | null>;
  update(id: string, data: UpdateLeadData): Promise<Lead>;
  delete(id: string): Promise<void>;
  findAll(filters?: LeadFilters): Promise<Lead[]>;
}

export interface IDealRepository {
  create(data: CreateDealData): Promise<Deal>;
  findById(id: string): Promise<Deal | null>;
  findByLeadId(leadId: string): Promise<Deal[]>;
  update(id: string, data: UpdateDealData): Promise<Deal>;
  delete(id: string): Promise<void>;
  findAll(filters?: DealFilters): Promise<Deal[]>;
}

export interface IActivityRepository {
  create(data: CreateActivityData): Promise<Activity>;
  findById(id: string): Promise<Activity | null>;
  findByLeadId(leadId: string): Promise<Activity[]>;
  findByDealId(dealId: string): Promise<Activity[]>;
  update(id: string, data: UpdateActivityData): Promise<Activity>;
  delete(id: string): Promise<void>;
  findAll(filters?: ActivityFilters): Promise<Activity[]>;
}

// Domain Types (owned by domain layer)
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  leadId: string;
  name: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: Date;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  leadId?: string;
  dealId?: string;
  type: ActivityType;
  subject: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}

// Domain Enums - LeadStatus is imported from types/LeadStatus.ts
export { LeadStatus };

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  COLD_CALL = 'cold_call',
  EMAIL = 'email',
  SOCIAL_MEDIA = 'social_media',
  OTHER = 'other'
}

export enum DealStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost'
}

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  TASK = 'task',
  NOTE = 'note'
}

// DTOs for domain operations
export interface CreateLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  assignedTo?: string;
}

export interface UpdateLeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  assignedTo?: string;
}

export interface CreateDealData {
  leadId: string;
  name: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: Date;
  assignedTo?: string;
}

export interface UpdateDealData {
  name?: string;
  value?: number;
  currency?: string;
  stage?: DealStage;
  probability?: number;
  expectedCloseDate?: Date;
  assignedTo?: string;
}

export interface CreateActivityData {
  leadId?: string;
  dealId?: string;
  type: ActivityType;
  subject: string;
  description?: string;
  scheduledAt?: Date;
  assignedTo: string;
}

export interface UpdateActivityData {
  type?: ActivityType;
  subject?: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  assignedTo?: string;
}

// Filter Types
export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  search?: string;
}

export interface DealFilters {
  stage?: DealStage;
  assignedTo?: string;
  leadId?: string;
  search?: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  assignedTo?: string;
  leadId?: string;
  dealId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
