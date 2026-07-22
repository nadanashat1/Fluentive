// DOMAIN LAYER: Policy Decision Engine
// Emits decisions ONLY - no execution rights (production-safe architecture)

import type { 
  Lead,
  Deal,
  Activity,
  LeadStatus,
  DealStage
} from '@domain/interfaces/repositories.interface';

// 🔒 POLICY DECISION - Pure decision output, no execution
export interface PolicyDecision {
  policyId: string;
  policyName: string;
  triggered: boolean;
  confidence: number; // 0-100 confidence score
  suggestedActions: PolicySuggestedAction[];
  reasoning: string;
  priority: number;
  metadata: Record<string, any>;
}

export interface PolicySuggestedAction {
  id: string;
  type: 'create_entity' | 'update_entity' | 'create_workflow' | 'send_notification' | 'schedule_task';
  target: {
    entityType?: 'lead' | 'deal' | 'activity';
    workflowId?: string;
  };
  data: Record<string, any>;
  estimatedImpact: 'low' | 'medium' | 'high';
  requiredApprovals?: string[];
}

export interface PolicyTrigger {
  eventType: string;
  entityType: 'lead' | 'deal' | 'activity' | 'system';
  filters?: Record<string, any>;
}

export interface PolicyCondition {
  type: 'simple' | 'composite' | 'script';
  operator?: 'and' | 'or';
  rules?: PolicyRule[];
  script?: string;
}

export interface PolicyRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  weight?: number; // For confidence calculation
}

export interface PolicyContext {
  event: {
    type: string;
    entityType: string;
    entityId: string;
    timestamp: Date;
    previousState?: any;
    newState?: any;
  };
  entities: {
    lead?: Lead;
    deal?: Deal;
    activity?: Activity;
  };
  metadata: Record<string, any>;
}

// 🔒 PURE DECISION POLICIES - No execution logic
export class PolicyDecisionEngine {
  private static readonly DECISION_POLICIES = [
    // Decision 1: Suggest auto-deal creation for qualified leads
    {
      id: 'suggest_deal_on_qualified_lead',
      name: 'Suggest Deal Creation on Qualified Lead',
      description: 'Suggests creating a deal when a lead becomes qualified',
      trigger: {
        eventType: 'lead_status_changed',
        entityType: 'lead',
        filters: { newStatus: 'qualified' }
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'newStatus', operator: 'equals', value: 'qualified', weight: 0.8 },
          { field: 'existingDealsCount', operator: 'equals', value: 0, weight: 0.6 }
        ]
      },
      suggestedActions: [
        {
          id: 'create_deal_suggestion',
          type: 'create_workflow' as const,
          target: { workflowId: 'auto_deal_creation' },
          data: {
            source: 'lead_qualified',
            priority: 'high',
            requiresApproval: false
          },
          estimatedImpact: 'high' as const
        }
      ],
      priority: 100
    },

    // Decision 2: Suggest lead auto-close on deal won
    {
      id: 'suggest_close_lead_on_deal_won',
      name: 'Suggest Lead Auto-Close on Deal Won',
      description: 'Suggests closing lead as converted when any associated deal is won',
      trigger: {
        eventType: 'deal_status_changed',
        entityType: 'deal',
        filters: { newStage: 'closed_won' }
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'newStage', operator: 'equals', value: 'closed_won', weight: 0.9 },
          { field: 'leadStatus', operator: 'not_equals', value: 'converted', weight: 0.7 }
        ]
      },
      suggestedActions: [
        {
          id: 'close_lead_suggestion',
          type: 'update_entity' as const,
          target: { entityType: 'lead' },
          data: {
            status: 'converted',
            notes: 'Automatically converted due to won deal',
            requiresApproval: false
          },
          estimatedImpact: 'medium' as const
        }
      ],
      priority: 90
    },

    // Decision 3: Suggest deal cancellation on lost lead
    {
      id: 'suggest_cancel_deals_on_lost_lead',
      name: 'Suggest Deal Cancellation on Lost Lead',
      description: 'Suggests canceling all active deals when a lead is marked as lost',
      trigger: {
        eventType: 'lead_status_changed',
        entityType: 'lead',
        filters: { newStatus: 'lost' }
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'newStatus', operator: 'equals', value: 'lost', weight: 0.8 },
          { field: 'activeDealsCount', operator: 'greater_than', value: 0, weight: 0.6 }
        ]
      },
      suggestedActions: [
        {
          id: 'cancel_deals_suggestion',
          type: 'create_workflow' as const,
          target: { workflowId: 'cancel_all_deals' },
          data: {
            reason: 'lead_lost',
            priority: 'high',
            requiresApproval: false
          },
          estimatedImpact: 'high' as const
        }
      ],
      priority: 95
    },

    // Decision 4: Suggest follow-up for stalled deals
    {
      id: 'suggest_follow_up_on_stalled_deal',
      name: 'Suggest Follow-up on Stalled Deal',
      description: 'Suggests follow-up task when deal hasn\'t moved in 7 days',
      trigger: {
        eventType: 'daily_cron',
        entityType: 'system'
      },
      condition: {
        type: 'composite',
        operator: 'and',
        rules: [
          { field: 'dealStage', operator: 'in', value: ['qualification', 'proposal', 'negotiation'], weight: 0.5 },
          { field: 'daysSinceLastUpdate', operator: 'greater_than', value: 7, weight: 0.7 },
          { field: 'assignedTo', operator: 'not_equals', value: null, weight: 0.4 }
        ]
      },
      suggestedActions: [
        {
          id: 'follow_up_suggestion',
          type: 'schedule_task' as const,
          target: { entityType: 'activity' },
          data: {
            type: 'task',
            subject: 'Follow up on stalled deal',
            priority: 'medium',
            dueInDays: 1,
            requiresApproval: false
          },
          estimatedImpact: 'medium' as const
        }
      ],
      priority: 50
    },

    // Decision 5: Suggest escalation for high-value deals
    {
      id: 'suggest_escalate_high_value_deals',
      name: 'Suggest Escalation for High-Value Deals',
      description: 'Suggests escalating deals above threshold to management',
      trigger: {
        eventType: 'deal_created',
        entityType: 'deal'
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'dealValue', operator: 'greater_than', value: 100000, weight: 0.8 },
          { field: 'currency', operator: 'equals', value: 'USD', weight: 0.6 }
        ]
      },
      suggestedActions: [
        {
          id: 'escalation_suggestion',
          type: 'send_notification' as const,
          target: {},
          data: {
            type: 'escalation',
            message: 'High-value deal created requiring management attention',
            channels: ['email', 'slack'],
            requiresApproval: true,
            requiredApprovals: ['manager', 'vp_sales']
          },
          estimatedImpact: 'high' as const,
          requiredApprovals: ['manager', 'vp_sales']
        }
      ],
      priority: 80
    }
  ];

  // 🔒 PURE DECISION ENGINE - Emits decisions only
  static async evaluatePolicyDecisions(context: PolicyContext): Promise<PolicyDecision[]> {
    const decisions: PolicyDecision[] = [];

    for (const policy of this.DECISION_POLICIES) {
      try {
        const decision = await this.evaluatePolicyDecision(policy, context);
        if (decision.triggered) {
          decisions.push(decision);
        }
      } catch (error) {
        console.error(`❌ Policy decision evaluation failed: ${policy.id}`, error);
      }
    }

    // Sort by priority and confidence
    return decisions
      .sort((a, b) => (b.priority + b.confidence) - (a.priority + a.confidence));
  }

  // 🔒 SINGLE POLICY DECISION EVALUATION
  private static async evaluatePolicyDecision(
    policy: any,
    context: PolicyContext
  ): Promise<PolicyDecision> {
    // Check if policy trigger matches the event
    if (!this.matchesTrigger(policy.trigger, context.event)) {
      return {
        policyId: policy.id,
        policyName: policy.name,
        triggered: false,
        confidence: 0,
        suggestedActions: [],
        reasoning: 'Trigger conditions not met',
        priority: policy.priority,
        metadata: {}
      };
    }

    // Evaluate condition and calculate confidence
    const conditionResult = await this.evaluateConditionWithConfidence(policy.condition, context);
    
    if (!conditionResult.met) {
      return {
        policyId: policy.id,
        policyName: policy.name,
        triggered: false,
        confidence: conditionResult.confidence,
        suggestedActions: [],
        reasoning: conditionResult.reasoning,
        priority: policy.priority,
        metadata: conditionResult.metadata
      };
    }

    console.log(`🎯 Policy decision triggered: ${policy.name} (${policy.id})`);

    return {
      policyId: policy.id,
      policyName: policy.name,
      triggered: true,
      confidence: conditionResult.confidence,
      suggestedActions: policy.suggestedActions,
      reasoning: conditionResult.reasoning,
      priority: policy.priority,
      metadata: {
        ...conditionResult.metadata,
        triggeredBy: context.event.type,
        timestamp: new Date()
      }
    };
  }

  // 🔒 CONDITION EVALUATION WITH CONFIDENCE CALCULATION
  private static async evaluateConditionWithConfidence(
    condition: PolicyCondition,
    context: PolicyContext
  ): Promise<{ met: boolean; confidence: number; reasoning: string; metadata: any }> {
    switch (condition.type) {
      case 'simple':
        return this.evaluateSimpleConditionWithConfidence(condition.rules || [], context);
      
      case 'composite':
        return this.evaluateCompositeConditionWithConfidence(condition, context);
      
      case 'script':
        return { met: false, confidence: 0, reasoning: 'Script conditions not implemented', metadata: {} };
      
      default:
        return { met: false, confidence: 0, reasoning: 'Unknown condition type', metadata: {} };
    }
  }

  private static evaluateSimpleConditionWithConfidence(
    rules: PolicyRule[],
    context: PolicyContext
  ): { met: boolean; confidence: number; reasoning: string; metadata: any } {
    const results = rules.map(rule => {
      const fieldValue = this.getFieldValue(rule.field, context);
      const ruleMet = this.compareValues(fieldValue, rule.operator, rule.value);
      const weight = rule.weight || 1.0;
      
      return {
        rule: `${rule.field} ${rule.operator} ${rule.value}`,
        met: ruleMet,
        weight,
        actualValue: fieldValue
      };
    });

    // All rules must be satisfied (implicit AND)
    const allMet = results.every(result => result.met);
    
    // Calculate weighted confidence
    const totalWeight = results.reduce((sum, result) => sum + result.weight, 0);
    const metWeight = results.filter(result => result.met).reduce((sum, result) => sum + result.weight, 0);
    const confidence = totalWeight > 0 ? (metWeight / totalWeight) * 100 : 0;

    const reasoning = results.map(r => `${r.rule}: ${r.met ? '✓' : '✗'} (actual: ${r.actualValue})`).join(', ');

    return {
      met: allMet,
      confidence,
      reasoning,
      metadata: { ruleResults: results }
    };
  }

  private static evaluateCompositeConditionWithConfidence(
    condition: PolicyCondition,
    context: PolicyContext
  ): { met: boolean; confidence: number; reasoning: string; metadata: any } {
    if (!condition.rules || condition.rules.length === 0) {
      return { met: true, confidence: 100, reasoning: 'No rules specified', metadata: {} };
    }

    const operator = condition.operator || 'and';
    const results = condition.rules.map(rule => {
      const fieldValue = this.getFieldValue(rule.field, context);
      const ruleMet = this.compareValues(fieldValue, rule.operator, rule.value);
      const weight = rule.weight || 1.0;
      
      return { met: ruleMet, weight };
    });

    const met = operator === 'and' 
      ? results.every(result => result.met)
      : results.some(result => result.met);

    const totalWeight = results.reduce((sum, result) => sum + result.weight, 0);
    const metWeight = results.filter(result => result.met).reduce((sum, result) => sum + result.weight, 0);
    const confidence = totalWeight > 0 ? (metWeight / totalWeight) * 100 : 0;

    const reasoning = `Composite condition (${operator}): ${results.map((r, i) => `Rule${i + 1}: ${r.met ? '✓' : '✗'}`).join(', ')}`;

    return {
      met,
      confidence,
      reasoning,
      metadata: { operator, ruleResults: results }
    };
  }

  // 🔒 HELPER METHODS (same as before but for decision engine)
  private static matchesTrigger(trigger: PolicyTrigger, event: PolicyContext['event']): boolean {
    if (trigger.eventType !== event.type) return false;
    if (trigger.entityType && trigger.entityType !== event.entityType) return false;
    
    if (trigger.filters) {
      for (const [key, value] of Object.entries(trigger.filters)) {
        if (event.newState?.[key] !== value && event.previousState?.[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private static getFieldValue(field: string, context: PolicyContext): any {
    const parts = field.split('.');
    
    if (parts[0] === 'event') {
      return this.getNestedValue(context.event, parts.slice(1));
    }
    
    if (parts[0] === 'lead' && context.entities.lead) {
      return this.getNestedValue(context.entities.lead, parts.slice(1));
    }
    
    if (parts[0] === 'deal' && context.entities.deal) {
      return this.getNestedValue(context.entities.deal, parts.slice(1));
    }
    
    if (parts[0] === 'activity' && context.entities.activity) {
      return this.getNestedValue(context.entities.activity, parts.slice(1));
    }

    // Special computed fields
    if (field === 'existingDealsCount') return context.metadata.existingDealsCount || 0;
    if (field === 'activeDealsCount') return context.metadata.activeDealsCount || 0;
    if (field === 'daysSinceLastUpdate') return context.metadata.daysSinceLastUpdate || 0;
    if (field === 'dealValue') return context.entities.deal?.value || 0;
    
    return undefined;
  }

  private static getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  private static compareValues(fieldValue: any, operator: PolicyRule['operator'], ruleValue: any): boolean {
    switch (operator) {
      case 'equals': return fieldValue === ruleValue;
      case 'not_equals': return fieldValue !== ruleValue;
      case 'greater_than': return Number(fieldValue) > Number(ruleValue);
      case 'less_than': return Number(fieldValue) < Number(ruleValue);
      case 'in': return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
      case 'not_in': return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
      default: return false;
    }
  }

  // 🔒 POLICY MANAGEMENT
  static getAllDecisionPolicies(): any[] {
    return [...this.DECISION_POLICIES];
  }

  static getDecisionPolicy(id: string): any {
    return this.DECISION_POLICIES.find(policy => policy.id === id);
  }
}
