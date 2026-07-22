// DOMAIN LAYER: Lead State Machine
// Owns ONLY Lead lifecycle logic - no cross-entity concerns

import { LeadStatus } from '@domain/interfaces/repositories.interface';

export interface StateTransition<S, E> {
  from: S;
  to: S;
  event: E;
  guard?: (context: LeadTransitionContext) => Promise<boolean> | boolean;
  sideEffect?: (context: LeadTransitionContext) => Promise<void> | void;
}

export interface LeadTransitionContext {
  entityId: string;
  userId?: string;
  metadata?: Record<string, any>;
  currentState: LeadStatus;
  targetState: LeadStatus;
  timestamp: Date;
}

export interface LeadStateMachineResult {
  allowed: boolean;
  reason?: string;
  sideEffects?: string[];
  invariants?: string[];
}

// 🔒 LEAD STATE MACHINE - Isolated Lead lifecycle only
export class LeadStateMachine {
  private static readonly TRANSITIONS: StateTransition<LeadStatus, string>[] = [
    // NEW → CONTACTED
    {
      from: LeadStatus.NEW,
      to: LeadStatus.CONTACTED,
      event: 'contact_lead',
      guard: async (ctx) => {
        return ctx.metadata?.contactMethod !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`📞 Lead ${ctx.entityId} contacted via ${ctx.metadata?.contactMethod}`);
      }
    },

    // CONTACTED → QUALIFIED
    {
      from: LeadStatus.CONTACTED,
      to: LeadStatus.QUALIFIED,
      event: 'qualify_lead',
      guard: async (ctx) => {
        const hasBudget = ctx.metadata?.hasBudget === true;
        const hasAuthority = ctx.metadata?.hasAuthority === true;
        const hasNeed = ctx.metadata?.hasNeed === true;
        const hasTimeline = ctx.metadata?.hasTimeline === true;
        
        return hasBudget && hasAuthority && hasNeed && hasTimeline;
      },
      sideEffect: (ctx) => {
        console.log(`✅ Lead ${ctx.entityId} qualified and ready for conversion`);
      }
    },

    // QUALIFIED → CONVERTED
    {
      from: LeadStatus.QUALIFIED,
      to: LeadStatus.CONVERTED,
      event: 'convert_lead',
      guard: async (ctx) => {
        // Note: Deal creation is handled by orchestrator, not state machine
        return ctx.metadata?.dealCreationInitiated === true;
      },
      sideEffect: (ctx) => {
        console.log(`🎯 Lead ${ctx.entityId} converted to opportunity`);
      }
    },

    // Any status → LOST (except CONVERTED)
    {
      from: LeadStatus.NEW,
      to: LeadStatus.LOST,
      event: 'lose_lead',
      guard: async (ctx) => {
        return ctx.metadata?.reason !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`❌ Lead ${ctx.entityId} lost: ${ctx.metadata?.reason}`);
      }
    },
    {
      from: LeadStatus.CONTACTED,
      to: LeadStatus.LOST,
      event: 'lose_lead',
      guard: async (ctx) => {
        return ctx.metadata?.reason !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`❌ Lead ${ctx.entityId} lost: ${ctx.metadata?.reason}`);
      }
    },
    {
      from: LeadStatus.QUALIFIED,
      to: LeadStatus.LOST,
      event: 'lose_lead',
      guard: async (ctx) => {
        return ctx.metadata?.reason !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`❌ Lead ${ctx.entityId} lost: ${ctx.metadata?.reason}`);
      }
    }
  ];

  // 🔒 SINGLE RESPONSIBILITY: Lead transition validation only
  static async canTransition(
    from: LeadStatus,
    to: LeadStatus,
    event: string,
    context: LeadTransitionContext
  ): Promise<LeadStateMachineResult> {
    const transition = this.TRANSITIONS.find(
      t => t.from === from && t.to === to && t.event === event
    );

    if (!transition) {
      return {
        allowed: false,
        reason: `Invalid lead transition: ${from} → ${to} via ${event}`
      };
    }

    // Check Lead-specific invariants
    const invariantCheck = this.checkLeadInvariants(from, to, context);
    if (!invariantCheck.allowed) {
      return invariantCheck;
    }

    // Execute guard
    if (transition.guard) {
      try {
        const guardResult = await transition.guard(context);
        if (!guardResult) {
          return {
            allowed: false,
            reason: `Lead transition guard failed for ${event}`
          };
        }
      } catch (error) {
        return {
          allowed: false,
          reason: `Lead guard execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition.sideEffect ? ['side_effect_executed'] : []
    };
  }

  // 🔒 SINGLE RESPONSIBILITY: Lead transition application only
  static async applyTransition(
    from: LeadStatus,
    to: LeadStatus,
    event: string,
    context: LeadTransitionContext
  ): Promise<LeadStateMachineResult> {
    const canTransitionResult = await this.canTransition(from, to, event, context);
    
    if (!canTransitionResult.allowed) {
      return canTransitionResult;
    }

    const transition = this.TRANSITIONS.find(
      t => t.from === from && t.to === to && t.event === event
    );

    if (transition?.sideEffect) {
      try {
        await transition.sideEffect(context);
      } catch (error) {
        return {
          allowed: false,
          reason: `Lead side effect execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition?.sideEffect ? ['side_effect_executed'] : [],
      invariants: this.getLeadInvariants(from, to)
    };
  }

  // 🔒 LEAD-SPECIFIC INVARIANTS ONLY
  private static checkLeadInvariants(
    from: LeadStatus,
    to: LeadStatus,
    context: LeadTransitionContext
  ): LeadStateMachineResult {
    // Invariant 1: Cannot convert unqualified lead
    if (to === LeadStatus.CONVERTED && from !== LeadStatus.QUALIFIED) {
      return {
        allowed: false,
        reason: 'Only qualified leads can be converted'
      };
    }

    // Invariant 2: Cannot transition from CONVERTED (terminal state)
    if (from === LeadStatus.CONVERTED && to !== LeadStatus.CONVERTED) {
      return {
        allowed: false,
        reason: 'Converted lead is in terminal state'
      };
    }

    // Invariant 3: Cannot transition from LOST (terminal state)
    if (from === LeadStatus.LOST && to !== LeadStatus.LOST) {
      return {
        allowed: false,
        reason: 'Lost lead is in terminal state'
      };
    }

    // Invariant 4: Email uniqueness (domain invariant)
    if (from === LeadStatus.NEW && context.metadata?.emailExists) {
      return {
        allowed: false,
        reason: 'Lead with this email already exists'
      };
    }

    return { allowed: true };
  }

  private static getLeadInvariants(from: LeadStatus, to: LeadStatus): string[] {
    const invariants: string[] = [];

    if (to === LeadStatus.CONVERTED) {
      invariants.push('lead_must_be_qualified');
      invariants.push('deal_creation_initiated');
    }

    if (to === LeadStatus.QUALIFIED) {
      invariants.push('budget_confirmed');
      invariants.push('authority_confirmed');
      invariants.push('need_confirmed');
      invariants.push('timeline_confirmed');
    }

    return invariants;
  }

  // 🔒 LEAD-SPECIFIC TRANSITIONS ONLY
  static getValidTransitions(currentState: LeadStatus): Array<{
    to: LeadStatus;
    event: string;
    requirements: string[];
  }> {
    return this.TRANSITIONS
      .filter(t => t.from === currentState)
      .map(t => ({
        to: t.to,
        event: t.event,
        requirements: this.getLeadTransitionRequirements(t)
      }));
  }

  private static getLeadTransitionRequirements(transition: StateTransition<LeadStatus, string>): string[] {
    const requirements: string[] = [];

    if (transition.event === 'contact_lead') {
      requirements.push('contact_method_required');
    }

    if (transition.event === 'qualify_lead') {
      requirements.push('budget_confirmed');
      requirements.push('authority_confirmed');
      requirements.push('need_confirmed');
      requirements.push('timeline_confirmed');
    }

    if (transition.event === 'convert_lead') {
      requirements.push('deal_creation_initiated');
    }

    if (transition.event === 'lose_lead') {
      requirements.push('loss_reason_required');
    }

    return requirements;
  }
}
