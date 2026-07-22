import { DealStage, DomainDeal, DomainLead, RuleResult, DomainEvent } from '../shared/types';
import { Roles, RoleType } from '@/constants/roles';


// Deal Business Rules Engine - Enforces Domain Invariants
export class DealRulesEngine {
  
  static validateDealCreation(deal: Partial<DomainDeal>, lead: DomainLead): RuleResult {
    // Business Rule: Deal must reference valid lead
    if (!deal.leadId || deal.leadId !== lead.id) {
      return {
        isValid: false,
        error: 'Deal must reference a valid lead',
        code: 'INVALID_LEAD_REFERENCE'
      };
    }

    // Business Rule: Lead must be qualified for conversion
    if (lead.status !== 'QUALIFIED') {
      return {
        isValid: false,
        error: `Lead must be QUALIFIED to create deal. Current status: ${lead.status}`,
        code: 'LEAD_NOT_QUALIFIED'
      };
    }

    // Business Rule: Deal must have title
    if (!deal.title || deal.title.trim().length === 0) {
      return {
        isValid: false,
        error: 'Deal must have a title',
        code: 'INVALID_DEAL_TITLE'
      };
    }

    // Business Rule: Deal value must be positive
    if (deal.value !== undefined && deal.value < 0) {
      return {
        isValid: false,
        error: 'Deal value must be positive',
        code: 'INVALID_DEAL_VALUE'
      };
    }

    // Business Rule: New deals start as DISCOVERY
    if (deal.stage && deal.stage !== DealStage.DISCOVERY) {
      return {
        isValid: false,
        error: 'New deals must start with DISCOVERY stage',
        code: 'INVALID_INITIAL_STAGE'
      };
    }

    return { isValid: true };
  }

  static validateDealStageTransition(currentStage: DealStage, newStage: DealStage): RuleResult {
    // Business Rule: Define allowed transitions
    const allowedTransitions: Record<DealStage, DealStage[]> = {
      [DealStage.OPEN]: [DealStage.DISCOVERY, DealStage.WON, DealStage.LOST],
      [DealStage.DISCOVERY]: [DealStage.QUALIFICATION, DealStage.PROPOSAL, DealStage.WON, DealStage.LOST],
      [DealStage.QUALIFICATION]: [DealStage.PROPOSAL, DealStage.WON, DealStage.LOST],
      [DealStage.PROPOSAL]: [DealStage.NEGOTIATION, DealStage.WON, DealStage.LOST],
      [DealStage.NEGOTIATION]: [DealStage.WON, DealStage.LOST],
      [DealStage.WON]: [], // Terminal state
      [DealStage.LOST]: [DealStage.OPEN] // Can reopen
    };

    const validTransitions = allowedTransitions[currentStage] || [];
    
    if (!validTransitions.includes(newStage)) {
      return {
        isValid: false,
        error: `Invalid transition from ${currentStage} to ${newStage}`,
        code: 'INVALID_DEAL_TRANSITION'
      };
    }

    return { isValid: true };
  }

  static validateDealUpdate(currentDeal: DomainDeal, updates: Partial<DomainDeal>): RuleResult {
    // Business Rule: Validate stage transition
    if (updates.stage && updates.stage !== currentDeal.stage) {
      const transitionResult = this.validateDealStageTransition(currentDeal.stage, updates.stage);
      if (!transitionResult.isValid) {
        return transitionResult;
      }
    }

    // Business Rule: Cannot change workspace
    if (updates.workspaceId && updates.workspaceId !== currentDeal.workspaceId) {
      return {
        isValid: false,
        error: 'Cannot change deal workspace',
        code: 'WORKSPACE_CHANGE_FORBIDDEN'
      };
    }

    // Business Rule: Cannot change lead reference
    if (updates.leadId && updates.leadId !== currentDeal.leadId) {
      return {
        isValid: false,
        error: 'Cannot change deal lead reference',
        code: 'LEAD_CHANGE_FORBIDDEN'
      };
    }

    // Business Rule: Cannot change owner without explicit transfer
    if (updates.ownerId && updates.ownerId !== currentDeal.ownerId) {
      return {
        isValid: false,
        error: 'Owner change requires explicit transfer process',
        code: 'OWNER_CHANGE_FORBIDDEN'
      };
    }

    // Business Rule: Value changes must be justified
    if (updates.value !== undefined && updates.value !== currentDeal.value) {
      if (updates.value < 0) {
        return {
          isValid: false,
          error: 'Deal value must be positive',
          code: 'INVALID_DEAL_VALUE'
        };
      }
    }

    return { isValid: true };
  }

  static validateDealDeletion(deal: DomainDeal): RuleResult {
    // Business Rule: Cannot delete won deals (business record)
    if (deal.stage === DealStage.WON) {
      return {
        isValid: false,
        error: 'Cannot delete won deals - business records must be preserved',
        code: 'WON_DEAL_DELETION_FORBIDDEN'
      };
    }

    // Business Rule: Lost deals can be archived but not deleted
    if (deal.stage === DealStage.LOST) {
      return {
        isValid: false,
        error: 'Lost deals should be archived, not deleted',
        code: 'LOST_DEAL_DELETION_FORBIDDEN'
      };
    }

    return { isValid: true };
  }

  static validateDealOwnership(deal: DomainDeal, userId: string, userRole: string): RuleResult {
    // Business Rule: User must own the deal
    if (deal.ownerId !== userId) {
      // Managers and admins can access any deal in workspace
      if (userRole !== Roles.MANAGER && userRole !== Roles.ADMIN) {
        return {
          isValid: false,
          error: 'User does not have permission to access this deal',
          code: 'INSUFFICIENT_PERMISSIONS'
        };
      }
    }

    return { isValid: true };
  }

  static createDealEvent(deal: DomainDeal, eventType: string, userId: string): DomainEvent {
    return {
      id: this.generateEventId(),
      type: eventType,
      aggregateId: deal.id,
      aggregateType: 'Deal',
      data: {
        dealId: deal.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        leadId: deal.leadId,
        ownerId: deal.ownerId,
        workspaceId: deal.workspaceId
      },
      timestamp: new Date(),
      userId,
      workspaceId: deal.workspaceId
    };
  }

  // Private helpers
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Deal Business Rules - Domain Invariants
export const DealBusinessRules = {
  // Rule: One active deal per lead
  async validateSingleActiveDeal(leadId: string, workspaceId: string, excludeDealId?: string): Promise<RuleResult> {
    // This would be implemented with repository pattern
    // For now, returning placeholder
    return { isValid: true };
  },

  // Rule: Deal value limits (business constraint)
  validateDealValueLimits(value: number, userTier: string = 'FREE'): RuleResult {
    const limits: Record<string, number> = {
      'FREE': 100000,
      'STARTER': 1000000,
      'PRO': 10000000,
      'ENTERPRISE': 100000000
    };

    const maxDealValue = limits[userTier] || limits['FREE'];
    
    if (value > maxDealValue) {
      return {
        isValid: false,
        error: `Deal value exceeds maximum for ${userTier} tier ($${maxDealValue})`,
        code: 'DEAL_VALUE_EXCEEDS_LIMIT'
      };
    }

    return { isValid: true };
  },

  // Rule: Deal pipeline capacity
  validatePipelineCapacity(activeDeals: number, maxAllowed: number = 100): RuleResult {
    if (activeDeals >= maxAllowed) {
      return {
        isValid: false,
        error: `Pipeline capacity exceeded (${maxAllowed} active deals)`,
        code: 'PIPELINE_CAPACITY_EXCEEDED'
      };
    }

    return { isValid: true };
  },

  // Rule: Deal velocity validation
  validateDealVelocity(dealCreationDate: Date, maxDaysInStage: number = 365): RuleResult {
    const daysInStage = Math.floor((Date.now() - dealCreationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysInStage > maxDaysInStage) {
      return {
        isValid: false,
        error: `Deal has been in pipeline too long (${daysInStage} days)`,
        code: 'DEAL_VELOCITY_TOO_SLOW'
      };
    }

    return { isValid: true };
  }
};
