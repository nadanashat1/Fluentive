import { LeadStatus, DomainLead, RuleResult, DomainEvent } from '../shared/types';

// Lead Lifecycle State Machine - Enforces Business Rules
export class LeadLifecycleEngine {
  private static transitions: Record<LeadStatus, LeadStatus[]> = {
    [LeadStatus.NEW]: [LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.LOST],
    [LeadStatus.CONTACTED]: [LeadStatus.QUALIFIED, LeadStatus.LOST],
    [LeadStatus.QUALIFIED]: [LeadStatus.PROPOSAL, LeadStatus.CONVERTED, LeadStatus.LOST],
    [LeadStatus.PROPOSAL]: [LeadStatus.NEGOTIATION, LeadStatus.CONVERTED, LeadStatus.LOST],
    [LeadStatus.NEGOTIATION]: [LeadStatus.CONVERTED, LeadStatus.LOST],
    [LeadStatus.CONVERTED]: [], // Terminal state
    [LeadStatus.LOST]: [LeadStatus.NEW] // Can restart cycle
  };

  static canTransition(from: LeadStatus, to: LeadStatus): RuleResult {
    const allowedTransitions = this.transitions[from] || [];
    
    if (!allowedTransitions.includes(to)) {
      return {
        isValid: false,
        error: `Invalid transition from ${from} to ${to}`,
        code: 'INVALID_LEAD_TRANSITION'
      };
    }

    return { isValid: true };
  }

  static validateLeadCreation(lead: Partial<DomainLead>): RuleResult {
    // Business Rule: Lead must have valid email
    if (!lead.email || !this.isValidEmail(lead.email)) {
      return {
        isValid: false,
        error: 'Lead must have a valid email address',
        code: 'INVALID_EMAIL'
      };
    }

    // Business Rule: Lead must have name
    if (!lead.name || lead.name.trim().length === 0) {
      return {
        isValid: false,
        error: 'Lead must have a name',
        code: 'INVALID_NAME'
      };
    }

    // Business Rule: New leads start as NEW status
    if (lead.status && lead.status !== LeadStatus.NEW) {
      return {
        isValid: false,
        error: 'New leads must start with NEW status',
        code: 'INVALID_INITIAL_STATUS'
      };
    }

    return { isValid: true };
  }

  static validateLeadUpdate(currentLead: DomainLead, updates: Partial<DomainLead>): RuleResult {
    // Business Rule: Validate status transition
    if (updates.status && updates.status !== currentLead.status) {
      const transitionResult = this.canTransition(currentLead.status, updates.status);
      if (!transitionResult.isValid) {
        return transitionResult;
      }
    }

    // Business Rule: Cannot change workspace
    if (updates.workspaceId && updates.workspaceId !== currentLead.workspaceId) {
      return {
        isValid: false,
        error: 'Cannot change lead workspace',
        code: 'WORKSPACE_CHANGE_FORBIDDEN'
      };
    }

    // Business Rule: Cannot change owner without permission
    if (updates.ownerId && updates.ownerId !== currentLead.ownerId) {
      return {
        isValid: false,
        error: 'Owner change requires explicit transfer process',
        code: 'OWNER_CHANGE_FORBIDDEN'
      };
    }

    return { isValid: true };
  }

  static validateLeadConversion(lead: DomainLead): RuleResult {
    if (lead.status === LeadStatus.CONVERTED) {
      return {
        isValid: false,
        error: 'Lead is already converted',
        code: 'LEAD_ALREADY_CONVERTED'
      };
    }

    if (lead.status !== LeadStatus.QUALIFIED) {
      return {
        isValid: false,
        error: `Lead must be QUALIFIED to convert. Current status: ${lead.status}`,
        code: 'LEAD_NOT_QUALIFIED'
      };
    }

    return { isValid: true };
  }

  static createLeadEvent(lead: DomainLead, eventType: string, userId: string): DomainEvent {
    return {
      id: this.generateEventId(),
      type: eventType,
      aggregateId: lead.id,
      aggregateType: 'Lead',
      data: {
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        ownerId: lead.ownerId,
        workspaceId: lead.workspaceId
      },
      timestamp: new Date(),
      userId,
      workspaceId: lead.workspaceId
    };
  }

  // Private helpers
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Lead Business Rules - Domain Invariants
export const LeadBusinessRules = {
  // Rule: Email uniqueness within workspace
  async validateEmailUniqueness(email: string, workspaceId: string, excludeLeadId?: string): Promise<RuleResult> {
    // This would be implemented with repository pattern
    // For now, returning placeholder
    return { isValid: true };
  },

  // Rule: Maximum leads per user (business constraint)
  validateLeadCapacity(userLeadCount: number, maxAllowed: number = 1000): RuleResult {
    if (userLeadCount >= maxAllowed) {
      return {
        isValid: false,
        error: `User has reached maximum lead capacity (${maxAllowed})`,
        code: 'LEAD_CAPACITY_EXCEEDED'
      };
    }
    return { isValid: true };
  },

  // Rule: Lead scoring eligibility
  validateLeadScoring(lead: DomainLead): RuleResult {
    const hasEmail = !!lead.email;
    const hasPhone = !!lead.phone;
    const hasName = !!lead.name && lead.name.length > 2;

    if (!hasEmail || !hasName) {
      return {
        isValid: false,
        error: 'Lead must have valid email and name for scoring',
        code: 'INSUFFICIENT_DATA_FOR_SCORING'
      };
    }

    return { isValid: true };
  }
};
