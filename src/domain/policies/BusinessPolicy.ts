// DOMAIN LAYER: Business Policy Engine
// Pure business rules and automation logic - no execution concerns

import type { 
  Lead,
  Deal,
  Activity,
  LeadStatus,
  DealStage
} from '@domain/interfaces/repositories.interface';

// 🔒 POLICY DEFINITION - Pure business rule abstraction
export interface BusinessPolicy {
  id: string;
  name: string;
  description: string;
  trigger: PolicyTrigger;
  condition: PolicyCondition;
  action: PolicyAction;
  priority: number;
  enabled: boolean;
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
  script?: string; // For complex rules
}

export interface PolicyRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface PolicyAction {
  type: 'create_entity' | 'update_entity' | 'create_workflow' | 'send_notification' | 'schedule_task';
  target: {
    entityType?: 'lead' | 'deal' | 'activity';
    workflowId?: string;
  };
  data: Record<string, any>;
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

export interface PolicyResult {
  policyId: string;
  triggered: boolean;
  actions: PolicyAction[];
  reason?: string;
}

// 🔒 BUSINESS POLICIES - Pure automation rules
export class BusinessPolicyEngine {
  private static readonly POLICIES: BusinessPolicy[] = [
    // Policy 1: Auto-create deal when lead is qualified
    {
      id: 'auto_deal_on_qualified_lead',
      name: 'Auto-create Deal on Qualified Lead',
      description: 'Automatically creates a deal when a lead becomes qualified',
      trigger: {
        eventType: 'lead_status_changed',
        entityType: 'lead',
        filters: { newStatus: 'qualified' }
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'newStatus', operator: 'equals', value: 'qualified' },
          { field: 'existingDealsCount', operator: 'equals', value: 0 }
        ]
      },
      action: {
        type: 'create_workflow',
        target: { workflowId: 'auto_deal_creation' },
        data: {
          source: 'lead_qualified',
          priority: 'high'
        }
      },
      priority: 100,
      enabled: true
    },

    // Policy 2: Auto-close lead when deal is won
    {
      id: 'auto_close_lead_on_deal_won',
      name: 'Auto-close Lead on Deal Won',
      description: 'Automatically closes lead as converted when any associated deal is won',
      trigger: {
        eventType: 'deal_status_changed',
        entityType: 'deal',
        filters: { newStage: 'closed_won' }
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'newStage', operator: 'equals', value: 'closed_won' },
          { field: 'leadStatus', operator: 'not_equals', value: 'converted' }
        ]
      },
      action: {
        type: 'update_entity',
        target: { entityType: 'lead' },
        data: {
          status: 'converted',
          notes: 'Automatically converted due to won deal'
        }
      },
      priority: 90,
      enabled: true
    },

    // Policy 3: Cancel all deals when lead is lost
    {
      id: 'cancel_deals_on_lost_lead',
      name: 'Cancel Deals on Lost Lead',
      description: 'Automatically cancels all active deals when a lead is marked as lost',
      trigger: {
        eventType: 'lead_status_changed',
        entityType: 'lead',
        filters: { newStatus: 'lost' }
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'newStatus', operator: 'equals', value: 'lost' },
          { field: 'activeDealsCount', operator: 'greater_than', value: 0 }
        ]
      },
      action: {
        type: 'create_workflow',
        target: { workflowId: 'cancel_all_deals' },
        data: {
          reason: 'lead_lost',
          priority: 'high'
        }
      },
      priority: 95,
      enabled: true
    },

    // Policy 4: Schedule follow-up when deal stalls
    {
      id: 'follow_up_on_stalled_deal',
      name: 'Follow-up on Stalled Deal',
      description: 'Creates follow-up task when deal hasn\'t moved in 7 days',
      trigger: {
        eventType: 'daily_cron',
        entityType: 'system'
      },
      condition: {
        type: 'composite',
        operator: 'and',
        rules: [
          { field: 'dealStage', operator: 'in', value: ['qualification', 'proposal', 'negotiation'] },
          { field: 'daysSinceLastUpdate', operator: 'greater_than', value: 7 },
          { field: 'assignedTo', operator: 'not_equals', value: null }
        ]
      },
      action: {
        type: 'schedule_task',
        target: { entityType: 'activity' },
        data: {
          type: 'task',
          subject: 'Follow up on stalled deal',
          priority: 'medium',
          dueInDays: 1
        }
      },
      priority: 50,
      enabled: true
    },

    // Policy 5: Escalate high-value deals
    {
      id: 'escalate_high_value_deals',
      name: 'Escalate High-Value Deals',
      description: 'Escalates deals above threshold to management',
      trigger: {
        eventType: 'deal_created',
        entityType: 'deal'
      },
      condition: {
        type: 'simple',
        rules: [
          { field: 'dealValue', operator: 'greater_than', value: 100000 },
          { field: 'currency', operator: 'equals', value: 'USD' }
        ]
      },
      action: {
        type: 'send_notification',
        target: {},
        data: {
          type: 'escalation',
          message: 'High-value deal created requiring management attention',
          channels: ['email', 'slack']
        }
      },
      priority: 80,
      enabled: true
    }
  ];

  // 🔒 POLICY EXECUTION ENGINE - Pure business logic
  static async evaluatePolicies(context: PolicyContext): Promise<PolicyResult[]> {
    const results: PolicyResult[] = [];

    // Get enabled policies sorted by priority
    const enabledPolicies = this.POLICIES
      .filter(policy => policy.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of enabledPolicies) {
      try {
        const result = await this.evaluatePolicy(policy, context);
        if (result.triggered) {
          results.push(result);
        }
      } catch (error) {
        console.error(`❌ Policy evaluation failed: ${policy.id}`, error);
      }
    }

    return results;
  }

  // 🔒 SINGLE POLICY EVALUATION
  private static async evaluatePolicy(
    policy: BusinessPolicy,
    context: PolicyContext
  ): Promise<PolicyResult> {
    // Check if policy trigger matches the event
    if (!this.matchesTrigger(policy.trigger, context.event)) {
      return {
        policyId: policy.id,
        triggered: false,
        actions: []
      };
    }

    // Evaluate policy condition
    const conditionMet = await this.evaluateCondition(policy.condition, context);
    
    if (!conditionMet) {
      return {
        policyId: policy.id,
        triggered: false,
        actions: []
      };
    }

    console.log(`🎯 Policy triggered: ${policy.name} (${policy.id})`);

    return {
      policyId: policy.id,
      triggered: true,
      actions: [policy.action],
      reason: `Policy condition met for ${policy.name}`
    };
  }

  // 🔒 TRIGGER MATCHING
  private static matchesTrigger(trigger: PolicyTrigger, event: PolicyContext['event']): boolean {
    if (trigger.eventType !== event.type) {
      return false;
    }

    if (trigger.entityType && trigger.entityType !== event.entityType) {
      return false;
    }

    // Check additional filters
    if (trigger.filters) {
      for (const [key, value] of Object.entries(trigger.filters)) {
        if (event.newState?.[key] !== value && event.previousState?.[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  // 🔒 CONDITION EVALUATION
  private static async evaluateCondition(
    condition: PolicyCondition,
    context: PolicyContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'simple':
        return this.evaluateSimpleCondition(condition.rules || [], context);
      
      case 'composite':
        return this.evaluateCompositeCondition(condition, context);
      
      case 'script':
        return this.evaluateScriptCondition(condition.script || '', context);
      
      default:
        return false;
    }
  }

  private static evaluateSimpleCondition(
    rules: PolicyRule[],
    context: PolicyContext
  ): boolean {
    // All rules must be satisfied (implicit AND)
    return rules.every(rule => {
      const fieldValue = this.getFieldValue(rule.field, context);
      return this.compareValues(fieldValue, rule.operator, rule.value);
    });
  }

  private static evaluateCompositeCondition(
    condition: PolicyCondition,
    context: PolicyContext
  ): boolean {
    if (!condition.rules || condition.rules.length === 0) {
      return true;
    }

    const operator = condition.operator || 'and';
    const results = condition.rules.map(rule => 
      this.compareValues(
        this.getFieldValue(rule.field, context),
        rule.operator,
        rule.value
      )
    );

    return operator === 'and' 
      ? results.every(result => result)
      : results.some(result => result);
  }

  private static async evaluateScriptCondition(
    script: string,
    context: PolicyContext
  ): Promise<boolean> {
    // In a real implementation, this would use a safe script engine
    // For now, return false (script conditions not implemented)
    console.warn(`⚠️ Script policy conditions not implemented: ${script}`);
    return false;
  }

  // 🔒 FIELD VALUE EXTRACTION
  private static getFieldValue(field: string, context: PolicyContext): any {
    // Extract values from context entities and event data
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
    if (field === 'existingDealsCount') {
      return context.metadata.existingDealsCount || 0;
    }
    
    if (field === 'activeDealsCount') {
      return context.metadata.activeDealsCount || 0;
    }
    
    if (field === 'daysSinceLastUpdate') {
      return context.metadata.daysSinceLastUpdate || 0;
    }
    
    return undefined;
  }

  private static getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  // 🔒 VALUE COMPARISON
  private static compareValues(
    fieldValue: any,
    operator: PolicyRule['operator'],
    ruleValue: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === ruleValue;
      
      case 'not_equals':
        return fieldValue !== ruleValue;
      
      case 'greater_than':
        return Number(fieldValue) > Number(ruleValue);
      
      case 'less_than':
        return Number(fieldValue) < Number(ruleValue);
      
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
      
      case 'not_in':
        return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
      
      default:
        return false;
    }
  }

  // 🔒 POLICY MANAGEMENT
  static getAllPolicies(): BusinessPolicy[] {
    return [...this.POLICIES];
  }

  static getPolicy(id: string): BusinessPolicy | undefined {
    return this.POLICIES.find(policy => policy.id === id);
  }

  static enablePolicy(id: string): boolean {
    const policy = this.getPolicy(id);
    if (policy) {
      policy.enabled = true;
      return true;
    }
    return false;
  }

  static disablePolicy(id: string): boolean {
    const policy = this.getPolicy(id);
    if (policy) {
      policy.enabled = false;
      return true;
    }
    return false;
  }

  static addPolicy(policy: BusinessPolicy): void {
    this.POLICIES.push(policy);
  }

  static removePolicy(id: string): boolean {
    const index = this.POLICIES.findIndex(policy => policy.id === id);
    if (index !== -1) {
      this.POLICIES.splice(index, 1);
      return true;
    }
    return false;
  }
}
