// DOMAIN LAYER: CRM State Machine Core
// SINGLE SOURCE OF TRUTH for all CRM business transitions and invariants

import { LeadStatus, DealStage } from '@domain/interfaces/repositories.interface';

// 🔒 STATE MACHINE CORE - Single authoritative transition system

export interface StateTransition<S, E> {
  from: S;
  to: S;
  event: E;
  guard?: (context: TransitionContext) => Promise<boolean> | boolean;
  sideEffect?: (context: TransitionContext) => Promise<void> | void;
}

export interface TransitionContext {
  entityId: string;
  entityType: 'lead' | 'deal' | 'activity';
  userId?: string;
  metadata?: Record<string, any>;
  currentState: any;
  targetState: any;
  timestamp: Date;
}

export interface StateMachineResult {
  allowed: boolean;
  reason?: string;
  sideEffects?: string[];
  invariants?: string[];
}

// 🔒 LEAD STATE MACHINE - Complete lifecycle definition
export class LeadStateMachine {
  private static readonly TRANSITIONS: StateTransition<LeadStatus, string>[] = [
    // NEW → CONTACTED
    {
      from: LeadStatus.NEW,
      to: LeadStatus.CONTACTED,
      event: 'contact_lead',
      guard: async (ctx) => {
        // Must have contact method recorded
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
        // Must have qualification criteria
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
        // Must have associated deal created
        return ctx.metadata?.dealCreated === true;
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

  // 🔒 SINGLE AUTHORITY: Can this transition happen?
  static async canTransition(
    from: LeadStatus,
    to: LeadStatus,
    event: string,
    context: TransitionContext
  ): Promise<StateMachineResult> {
    const transition = this.TRANSITIONS.find(
      t => t.from === from && t.to === to && t.event === event
    );

    if (!transition) {
      return {
        allowed: false,
        reason: `Invalid transition: ${from} → ${to} via ${event}`
      };
    }

    // Check invariants
    const invariantCheck = this.checkInvariants(from, to, context);
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
            reason: `Transition guard failed for ${event}`
          };
        }
      } catch (error) {
        return {
          allowed: false,
          reason: `Guard execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition.sideEffect ? ['side_effect_executed'] : []
    };
  }

  // 🔒 SINGLE AUTHORITY: Apply transition with side effects
  static async applyTransition(
    from: LeadStatus,
    to: LeadStatus,
    event: string,
    context: TransitionContext
  ): Promise<StateMachineResult> {
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
          reason: `Side effect execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition?.sideEffect ? ['side_effect_executed'] : [],
      invariants: this.getInvariants(from, to)
    };
  }

  // 🔒 BUSINESS INVARIANTS - Core rules that must always hold
  private static checkInvariants(
    from: LeadStatus,
    to: LeadStatus,
    context: TransitionContext
  ): StateMachineResult {
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

    // Invariant 4: Email uniqueness (would be checked in repository)
    // This is a domain invariant that must be enforced
    if (from === LeadStatus.NEW && context.metadata?.emailExists) {
      return {
        allowed: false,
        reason: 'Lead with this email already exists'
      };
    }

    return { allowed: true };
  }

  private static getInvariants(from: LeadStatus, to: LeadStatus): string[] {
    const invariants: string[] = [];

    if (to === LeadStatus.CONVERTED) {
      invariants.push('lead_must_be_qualified');
      invariants.push('deal_must_exist');
    }

    if (to === LeadStatus.QUALIFIED) {
      invariants.push('budget_confirmed');
      invariants.push('authority_confirmed');
      invariants.push('need_confirmed');
      invariants.push('timeline_confirmed');
    }

    return invariants;
  }

  // 🔒 GET ALL VALID TRANSITIONS FROM CURRENT STATE
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
        requirements: this.getTransitionRequirements(t)
      }));
  }

  private static getTransitionRequirements(transition: StateTransition<LeadStatus, string>): string[] {
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
      requirements.push('deal_created');
    }

    if (transition.event === 'lose_lead') {
      requirements.push('loss_reason_required');
    }

    return requirements;
  }
}

// 🔒 DEAL STATE MACHINE - Complete lifecycle definition
export class DealStateMachine {
  private static readonly TRANSITIONS: StateTransition<DealStage, string>[] = [
    // PROSPECTING → QUALIFICATION
    {
      from: DealStage.PROSPECTING,
      to: DealStage.QUALIFICATION,
      event: 'start_qualification',
      guard: async (ctx) => {
        return ctx.metadata?.leadQualified === true;
      },
      sideEffect: (ctx) => {
        console.log(`🔍 Deal ${ctx.entityId} entered qualification stage`);
      }
    },

    // QUALIFICATION → PROPOSAL
    {
      from: DealStage.QUALIFICATION,
      to: DealStage.PROPOSAL,
      event: 'send_proposal',
      guard: async (ctx) => {
        return ctx.metadata?.proposalDetails !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`📄 Proposal sent for deal ${ctx.entityId}`);
      }
    },

    // PROPOSAL → NEGOTIATION
    {
      from: DealStage.PROPOSAL,
      to: DealStage.NEGOTIATION,
      event: 'start_negotiation',
      guard: async (ctx) => {
        return ctx.metadata?.proposalAccepted === true;
      },
      sideEffect: (ctx) => {
        console.log(`🤝 Negotiation started for deal ${ctx.entityId}`);
      }
    },

    // NEGOTIATION → CLOSED_WON
    {
      from: DealStage.NEGOTIATION,
      to: DealStage.CLOSED_WON,
      event: 'win_deal',
      guard: async (ctx) => {
        return ctx.metadata?.contractSigned === true;
      },
      sideEffect: (ctx) => {
        console.log(`🎉 Deal ${ctx.entityId} won! Value: ${ctx.metadata?.finalValue}`);
      }
    },

    // Any stage → CLOSED_LOST
    {
      from: DealStage.PROSPECTING,
      to: DealStage.CLOSED_LOST,
      event: 'lose_deal',
      guard: async (ctx) => {
        return ctx.metadata?.lossReason !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`❌ Deal ${ctx.entityId} lost: ${ctx.metadata?.lossReason}`);
      }
    },
    {
      from: DealStage.QUALIFICATION,
      to: DealStage.CLOSED_LOST,
      event: 'lose_deal',
      guard: async (ctx) => {
        return ctx.metadata?.lossReason !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`❌ Deal ${ctx.entityId} lost: ${ctx.metadata?.lossReason}`);
      }
    },
    {
      from: DealStage.PROPOSAL,
      to: DealStage.CLOSED_LOST,
      event: 'lose_deal',
      guard: async (ctx) => {
        return ctx.metadata?.lossReason !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`❌ Deal ${ctx.entityId} lost: ${ctx.metadata?.lossReason}`);
      }
    },
    {
      from: DealStage.NEGOTIATION,
      to: DealStage.CLOSED_LOST,
      event: 'lose_deal',
      guard: async (ctx) => {
        return ctx.metadata?.lossReason !== undefined;
      },
      sideEffect: (ctx) => {
        console.log(`❌ Deal ${ctx.entityId} lost: ${ctx.metadata?.lossReason}`);
      }
    }
  ];

  // 🔒 SINGLE AUTHORITY: Can this transition happen?
  static async canTransition(
    from: DealStage,
    to: DealStage,
    event: string,
    context: TransitionContext
  ): Promise<StateMachineResult> {
    const transition = this.TRANSITIONS.find(
      t => t.from === from && t.to === to && t.event === event
    );

    if (!transition) {
      return {
        allowed: false,
        reason: `Invalid transition: ${from} → ${to} via ${event}`
      };
    }

    // Check invariants
    const invariantCheck = this.checkInvariants(from, to, context);
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
            reason: `Transition guard failed for ${event}`
          };
        }
      } catch (error) {
        return {
          allowed: false,
          reason: `Guard execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition.sideEffect ? ['side_effect_executed'] : []
    };
  }

  // 🔒 SINGLE AUTHORITY: Apply transition with side effects
  static async applyTransition(
    from: DealStage,
    to: DealStage,
    event: string,
    context: TransitionContext
  ): Promise<StateMachineResult> {
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
          reason: `Side effect execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition?.sideEffect ? ['side_effect_executed'] : [],
      invariants: this.getInvariants(from, to)
    };
  }

  // 🔒 BUSINESS INVARIITS - Core rules that must always hold
  private static checkInvariants(
    from: DealStage,
    to: DealStage,
    context: TransitionContext
  ): StateMachineResult {
    // Invariant 1: Cannot transition from terminal states
    if ((from === DealStage.CLOSED_WON || from === DealStage.CLOSED_LOST) && 
        from !== to) {
      return {
        allowed: false,
        reason: 'Deal is in terminal state and cannot transition'
      };
    }

    // Invariant 2: Deal must have valid value
    if (context.metadata?.value !== undefined && context.metadata.value <= 0) {
      return {
        allowed: false,
        reason: 'Deal value must be positive'
      };
    }

    // Invariant 3: Probability must match stage
    const validProbabilities: Record<DealStage, number[]> = {
      [DealStage.PROSPECTING]: [5, 10, 15],
      [DealStage.QUALIFICATION]: [20, 25, 30],
      [DealStage.PROPOSAL]: [40, 50, 60],
      [DealStage.NEGOTIATION]: [70, 75, 80],
      [DealStage.CLOSED_WON]: [100],
      [DealStage.CLOSED_LOST]: [0]
    };

    if (context.metadata?.probability !== undefined) {
      const allowedProbabilities = validProbabilities[to];
      if (!allowedProbabilities.includes(context.metadata.probability)) {
        return {
          allowed: false,
          reason: `Invalid probability ${context.metadata.probability} for stage ${to}`
        };
      }
    }

    return { allowed: true };
  }

  private static getInvariants(from: DealStage, to: DealStage): string[] {
    const invariants: string[] = [];

    if (to === DealStage.CLOSED_WON) {
      invariants.push('contract_signed');
      invariants.push('final_value_confirmed');
    }

    if (to === DealStage.CLOSED_LOST) {
      invariants.push('loss_reason_documented');
    }

    if (to === DealStage.PROPOSAL) {
      invariants.push('proposal_details_complete');
    }

    return invariants;
  }

  // 🔒 GET ALL VALID TRANSITIONS FROM CURRENT STATE
  static getValidTransitions(currentState: DealStage): Array<{
    to: DealStage;
    event: string;
    requirements: string[];
  }> {
    return this.TRANSITIONS
      .filter(t => t.from === currentState)
      .map(t => ({
        to: t.to,
        event: t.event,
        requirements: this.getTransitionRequirements(t)
      }));
  }

  private static getTransitionRequirements(transition: StateTransition<DealStage, string>): string[] {
    const requirements: string[] = [];

    if (transition.event === 'start_qualification') {
      requirements.push('lead_qualified');
    }

    if (transition.event === 'send_proposal') {
      requirements.push('proposal_details_complete');
    }

    if (transition.event === 'start_negotiation') {
      requirements.push('proposal_accepted');
    }

    if (transition.event === 'win_deal') {
      requirements.push('contract_signed');
    }

    if (transition.event === 'lose_deal') {
      requirements.push('loss_reason_documented');
    }

    return requirements;
  }
}

// 🔒 CENTRAL TRANSITION VALIDATOR - Single source of truth
export class CRMTransitionValidator {
  // 🔒 SINGLE ENTRY POINT: Validate any CRM transition
  static async validateTransition(
    entityType: 'lead' | 'deal' | 'activity',
    from: any,
    to: any,
    event: string,
    context: TransitionContext
  ): Promise<StateMachineResult> {
    context.entityType = entityType;
    context.currentState = from;
    context.targetState = to;

    switch (entityType) {
      case 'lead':
        return await LeadStateMachine.canTransition(from, to, event, context);
      case 'deal':
        return await DealStateMachine.canTransition(from, to, event, context);
      default:
        return {
          allowed: false,
          reason: `Unsupported entity type: ${entityType}`
        };
    }
  }

  // 🔒 SINGLE ENTRY POINT: Apply any CRM transition
  static async applyTransition(
    entityType: 'lead' | 'deal' | 'activity',
    from: any,
    to: any,
    event: string,
    context: TransitionContext
  ): Promise<StateMachineResult> {
    context.entityType = entityType;
    context.currentState = from;
    context.targetState = to;

    switch (entityType) {
      case 'lead':
        return await LeadStateMachine.applyTransition(from, to, event, context);
      case 'deal':
        return await DealStateMachine.applyTransition(from, to, event, context);
      default:
        return {
          allowed: false,
          reason: `Unsupported entity type: ${entityType}`
        };
    }
  }

  // 🔒 GET VALID TRANSITIONS FOR ANY ENTITY
  static getValidTransitions(
    entityType: 'lead' | 'deal',
    currentState: any
  ): Array<{
    to: any;
    event: string;
    requirements: string[];
  }> {
    switch (entityType) {
      case 'lead':
        return LeadStateMachine.getValidTransitions(currentState);
      case 'deal':
        return DealStateMachine.getValidTransitions(currentState);
      default:
        return [];
    }
  }
}
