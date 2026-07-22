// DOMAIN LAYER: Service Contracts
// These interfaces define business service contracts
import type {
  Lead,
  Deal,
  Activity,
  LeadStatus,
  LeadSource,
  DealStage,
  ActivityType,
  CreateLeadData,
  UpdateLeadData,
  CreateDealData,
  UpdateDealData,
  CreateActivityData,
  UpdateActivityData,
  LeadFilters,
  DealFilters,
  ActivityFilters
} from './repositories.interface';

export interface ILeadService {
  createLead(data: CreateLeadData): Promise<Lead>;
  getLead(id: string): Promise<Lead | null>;
  updateLead(id: string, data: UpdateLeadData): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  findLeads(filters?: LeadFilters): Promise<Lead[]>;
  convertToDeal(leadId: string, dealData: CreateDealData): Promise<Deal>;
}

export interface IDealService {
  createDeal(data: CreateDealData): Promise<Deal>;
  getDeal(id: string): Promise<Deal | null>;
  updateDeal(id: string, data: UpdateDealData): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  findDeals(filters?: DealFilters): Promise<Deal[]>;
  moveStage(dealId: string, newStage: DealStage): Promise<Deal>;
}

export interface IActivityService {
  createActivity(data: CreateActivityData): Promise<Activity>;
  getActivity(id: string): Promise<Activity | null>;
  updateActivity(id: string, data: UpdateActivityData): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;
  findActivities(filters?: ActivityFilters): Promise<Activity[]>;
  completeActivity(id: string): Promise<Activity>;
}

// Domain Events
export interface IDomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  data: any;
  occurredAt: Date;
}

export interface ILeadEvent extends IDomainEvent {
  type: 'lead_created' | 'lead_updated' | 'lead_converted' | 'lead_deleted';
  aggregateId: string; // leadId
  data: {
    lead: Lead;
    previousState?: Lead;
  };
}

export interface IDealEvent extends IDomainEvent {
  type: 'deal_created' | 'deal_updated' | 'deal_stage_changed' | 'deal_won' | 'deal_lost' | 'deal_deleted';
  aggregateId: string; // dealId
  data: {
    deal: Deal;
    previousState?: Deal;
  };
}

export interface IActivityEvent extends IDomainEvent {
  type: 'activity_created' | 'activity_updated' | 'activity_completed' | 'activity_deleted';
  aggregateId: string; // activityId
  data: {
    activity: Activity;
    previousState?: Activity;
  };
}

// Event Publisher Interface
export interface IEventPublisher {
  publish(event: IDomainEvent): Promise<void>;
  publishBatch(events: IDomainEvent[]): Promise<void>;
}

// Re-export types from repositories for convenience
export type {
  Lead,
  Deal,
  Activity,
  LeadStatus,
  LeadSource,
  DealStage,
  ActivityType,
  CreateLeadData,
  UpdateLeadData,
  CreateDealData,
  UpdateDealData,
  CreateActivityData,
  UpdateActivityData,
  LeadFilters,
  DealFilters,
  ActivityFilters
} from './repositories.interface';
