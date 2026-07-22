// Domain Execution Gateway - Single Entry Point
import { DomainUser, DomainLead, DomainDeal, DomainActivity, RuleResult, ActivityType, DomainEvent } from './shared/types';
import { LeadStatus, DealStage } from '@prisma/client';
import { LeadLifecycleEngine } from './lead/lifecycle';
import { DealRulesEngine } from './deal/rules';
import { ActivityEventEngine } from './activity/events';
import { AuthorizationKernel } from './auth/kernel';
import { DomainInvariants } from './shared/invariants';

export type { DomainLead, DomainDeal, DomainActivity, DomainEvent };

// Domain Commands - Business Intent
export interface DomainCommand {
  type: string;
  userId: string;
  workspaceId: string;
  data: any;
  metadata?: any;
}

// Domain Results - Execution Outcome
export interface DomainResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  events?: DomainEvent[];
}

// Repository Interfaces - Domain owns data access
export interface LeadRepository {
  findById(id: string, workspaceId: string): Promise<DomainLead | null>;
  findByEmail(email: string, workspaceId: string): Promise<DomainLead | null>;
  create(lead: DomainLead): Promise<DomainLead>;
  update(id: string, updates: Partial<DomainLead>): Promise<DomainLead>;
  delete(id: string, workspaceId: string): Promise<void>;
  findMany(workspaceId: string, filters: any): Promise<DomainLead[]>;
}

export interface DealRepository {
  findById(id: string, workspaceId: string): Promise<DomainDeal | null>;
  findByLeadId(leadId: string, workspaceId: string): Promise<DomainDeal[]>;
  create(deal: DomainDeal): Promise<DomainDeal>;
  update(id: string, updates: Partial<DomainDeal>): Promise<DomainDeal>;
  delete(id: string, workspaceId: string): Promise<void>;
  findMany(workspaceId: string, filters: any): Promise<DomainDeal[]>;
}

export interface ActivityRepository {
  create(activity: DomainActivity): Promise<DomainActivity>;
  findByEntity(aggregateId: string, workspaceId: string): Promise<DomainActivity[]>;
}

// Domain Engine - Orchestrates all domain operations
export class DomainEngine {
  constructor(
    private leadRepo: LeadRepository,
    private dealRepo: DealRepository,
    private activityRepo: ActivityRepository
  ) {}

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Execute any domain command
  async execute(command: DomainCommand): Promise<DomainResult> {
    try {
      // Route to appropriate handler
      switch (command.type) {
        case 'lead.create':
          return this.createLead(command);
        case 'lead.update':
          return this.updateLead(command);
        case 'lead.delete':
          return this.deleteLead(command);
        case 'lead.convert':
          return this.convertLead(command);
        case 'deal.create':
          return this.createDeal(command);
        case 'deal.update':
          return this.updateDeal(command);
        case 'deal.win':
          return this.winDeal(command);
        case 'deal.lose':
          return this.loseDeal(command);
        case 'deal.delete':
          return this.deleteDeal(command);
        case 'activity.log':
          return this.logActivity(command);
        default:
          return {
            success: false,
            error: `Unknown command type: ${command.type}`,
            code: 'UNKNOWN_COMMAND'
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'EXECUTION_ERROR'
      };
    }
  }

  // Lead Operations
  private async createLead(command: DomainCommand): Promise<DomainResult<DomainLead>> {
    const { userId, workspaceId, data } = command;

    // Validate business rules
    const validation = LeadLifecycleEngine.validateLeadCreation(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        code: validation.code
      };
    }

    // Create lead through repository
    const lead = await this.leadRepo.create({
      id: this.generateId(),
      workspaceId,
      ownerId: userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: LeadStatus.NEW,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Emit domain event automatically
    const event = LeadLifecycleEngine.createLeadEvent(lead, 'LEAD_CREATED', userId);

    return {
      success: true,
      data: lead,
      events: [event]
    };
  }

  private async updateLead(command: DomainCommand): Promise<DomainResult<DomainLead>> {
    const { userId, workspaceId, data } = command;
    const { leadId, updates } = data;

    const lead = await this.leadRepo.findById(leadId, workspaceId);
    if (!lead) {
      return {
        success: false,
        error: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      };
    }

    const updatedLead = await this.leadRepo.update(leadId, {
      ...updates,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: updatedLead
    };
  }

  private async deleteLead(command: DomainCommand): Promise<DomainResult<void>> {
    const { userId, workspaceId, data } = command;
    const { leadId } = data;

    const lead = await this.leadRepo.findById(leadId, workspaceId);
    if (!lead) {
      return {
        success: false,
        error: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      };
    }

    await this.leadRepo.delete(leadId, workspaceId);
    return {
      success: true
    };
  }

  private async convertLead(command: DomainCommand): Promise<DomainResult<DomainDeal>> {
    const { userId, workspaceId, data } = command;
    const { leadId, dealData } = data;

    const lead = await this.leadRepo.findById(leadId, workspaceId);
    if (!lead) {
      return {
        success: false,
        error: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      };
    }

    const deal = await this.dealRepo.create({
      id: this.generateId(),
      workspaceId,
      ownerId: userId,
      leadId,
      title: dealData.title,
      value: dealData.value,
      stage: DealStage.OPEN,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.leadRepo.update(leadId, {
      status: LeadStatus.CONVERTED,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: deal
    };
  }

  // Deal Operations
  private async createDeal(command: DomainCommand): Promise<DomainResult<DomainDeal>> {
    const { userId, workspaceId, data } = command;
    const leadId = data?.leadId as string | undefined;
    if (!leadId) {
      return {
        success: false,
        error: 'leadId is required to create a deal',
        code: 'VALIDATION_ERROR'
      };
    }

    const deal = await this.dealRepo.create({
      id: this.generateId(),
      workspaceId,
      ownerId: userId,
      leadId,
      title: data.title,
      value: data.value,
      stage: DealStage.OPEN,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      data: deal
    };
  }

  private async updateDeal(command: DomainCommand): Promise<DomainResult<DomainDeal>> {
    const { userId, workspaceId, data } = command;
    const { dealId, updates } = data;

    const deal = await this.dealRepo.findById(dealId, workspaceId);
    if (!deal) {
      return {
        success: false,
        error: 'Deal not found',
        code: 'DEAL_NOT_FOUND'
      };
    }

    const updatedDeal = await this.dealRepo.update(dealId, {
      ...updates,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: updatedDeal
    };
  }

  private async winDeal(command: DomainCommand): Promise<DomainResult<DomainDeal>> {
    const { userId, workspaceId, data } = command;
    const { dealId } = data;

    const deal = await this.dealRepo.findById(dealId, workspaceId);
    if (!deal) {
      return {
        success: false,
        error: 'Deal not found',
        code: 'DEAL_NOT_FOUND'
      };
    }

    const updatedDeal = await this.dealRepo.update(dealId, {
      stage: DealStage.WON,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: updatedDeal
    };
  }

  private async loseDeal(command: DomainCommand): Promise<DomainResult<DomainDeal>> {
    const { userId, workspaceId, data } = command;
    const { dealId } = data;

    const deal = await this.dealRepo.findById(dealId, workspaceId);
    if (!deal) {
      return {
        success: false,
        error: 'Deal not found',
        code: 'DEAL_NOT_FOUND'
      };
    }

    const updatedDeal = await this.dealRepo.update(dealId, {
      stage: DealStage.LOST,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: updatedDeal
    };
  }

  private async deleteDeal(command: DomainCommand): Promise<DomainResult<void>> {
    const { userId, workspaceId, data } = command;
    const { dealId } = data;

    const deal = await this.dealRepo.findById(dealId, workspaceId);
    if (!deal) {
      return {
        success: false,
        error: 'Deal not found',
        code: 'DEAL_NOT_FOUND'
      };
    }

    await this.dealRepo.delete(dealId, workspaceId);
    return {
      success: true
    };
  }

  // Activity Operations
  private async logActivity(command: DomainCommand): Promise<DomainResult<DomainActivity>> {
    const { userId, workspaceId, data } = command;

    const activity = await this.activityRepo.create({
      id: this.generateId(),
      workspaceId,
      userId: (data.userId as string) ?? userId,
      leadId: data.leadId as string | undefined,
      dealId: data.dealId as string | undefined,
      type: (data.type as ActivityType) ?? ActivityType.NOTE_ADDED,
      description:
        typeof data.description === 'string'
          ? data.description
          : JSON.stringify(data.description ?? {}),
      createdAt: new Date()
    });

    return {
      success: true,
      data: activity
    };
  }
}

// Singleton instance
export const domainEngine = new DomainEngine(
  // TODO: Inject actual repositories
  null as any,
  null as any,
  null as any
);
