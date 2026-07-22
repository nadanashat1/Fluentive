// DOMAIN LAYER: Deal State Machine
// Owns ONLY Deal lifecycle logic - no cross-entity concerns

import { DealStage } from '@domain/interfaces/repositories.interface';

export interface DealStateTransition<S, E> {
  from: S;
  to: S;
  event: E;
  guard?: (context: DealTransitionContext) => Promise<boolean> | boolean;
  sideEffect?: (context: DealTransitionContext) => Promise<void> | void;
}

export interface DealTransitionContext {
  entityId: string;
  userId?: string;
  metadata?: Record<string, any>;
  currentState: DealStage;
  targetState: DealStage;
  timestamp: Date;
}

export interface DealStateMachineResult {
  allowed: boolean;
  reason?: string;
  sideEffects?: string[];
  invariants?: string[];
}

// 🔒 DEAL STATE MACHINE - Isolated Deal lifecycle only
export class DealStateMachine {
  private static readonly TRANSITIONS: DealStateTransition<DealStage, string>[] = [
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

  // 🔒 SINGLE RESPONSIBILITY: Deal transition validation only
  static async canTransition(
    from: DealStage,
    to: DealStage,
    event: string,
    context: DealTransitionContext
  ): Promise<DealStateMachineResult> {
    const transition = this.TRANSITIONS.find(
      t => t.from === from && t.to === to && t.event === event
    );

    if (!transition) {
      return {
        allowed: false,
        reason: `Invalid deal transition: ${from} → ${to} via ${event}`
      };
    }

    // Check Deal-specific invariants
    const invariantCheck = this.checkDealInvariants(from, to, context);
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
            reason: `Deal transition guard failed for ${event}`
          };
        }
      } catch (error) {
        return {
          allowed: false,
          reason: `Deal guard execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition.sideEffect ? ['side_effect_executed'] : []
    };
  }

  // 🔒 SINGLE RESPONSIBILITY: Deal transition application only
  static async applyTransition(
    from: DealStage,
    to: DealStage,
    event: string,
    context: DealTransitionContext
  ): Promise<DealStateMachineResult> {
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
          reason: `Deal side effect execution failed: ${(error as Error).message}`
        };
      }
    }

    return {
      allowed: true,
      sideEffects: transition?.sideEffect ? ['side_effect_executed'] : [],
      invariants: this.getDealInvariants(from, to)
    };
  }

  // 🔒 DEAL-SPECIFIC INVARIANTS ONLY
  private static checkDealInvariants(
    from: DealStage,
    to: DealStage,
    context: DealTransitionContext
  ): DealStateMachineResult {
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

  private static getDealInvariants(from: DealStage, to: DealStage): string[] {
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

  // 🔒 DEAL-SPECIFIC TRANSITIONS ONLY
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
        requirements: this.getDealTransitionRequirements(t)
      }));
  }

  private static getDealTransitionRequirements(transition: DealStateTransition<DealStage, string>): string[] {
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
