// DOMAIN LAYER: Policy Reaction Engine
// Executes policy actions without mixing with business logic

import type { 
  Lead,
  Deal,
  Activity,
  CreateDealData,
  CreateActivityData,
  LeadStatus
} from '@domain/interfaces/repositories.interface';

import { 
  DealStage
} from '@domain/interfaces/repositories.interface';

import { 
  BusinessPolicyEngine,
  PolicyContext,
  PolicyResult,
  PolicyAction
} from './BusinessPolicy';

import { 
  CRMOrchestrator,
  WorkflowContext
} from '@domain/orchestration/CRMOrchestrator';

// 🔒 POLICY REACTION EXECUTOR
export interface PolicyReactionResult {
  success: boolean;
  policyId: string;
  actionType: string;
  result?: any;
  error?: Error;
}

// 🔒 POLICY REACTION ENGINE - Pure execution of policy actions
export class PolicyReactionEngine {
  // 🔒 MAIN ENTRY POINT: Execute triggered policy actions
  static async executePolicyActions(
    policyResults: PolicyResult[],
    context: PolicyContext
  ): Promise<PolicyReactionResult[]> {
    const reactionResults: PolicyReactionResult[] = [];

    // Execute actions in priority order
    for (const policyResult of policyResults) {
      for (const action of policyResult.actions) {
        try {
          console.log(`🎯 Executing policy action: ${action.type} for policy ${policyResult.policyId}`);
          
          const result = await this.executePolicyAction(action, context);
          reactionResults.push(result);

          if (!result.success) {
            console.error(`❌ Policy action failed: ${action.type}`, result.error);
          }

        } catch (error) {
          console.error(`💥 Policy action execution error: ${action.type}`, error);
          reactionResults.push({
            success: false,
            policyId: policyResult.policyId,
            actionType: action.type,
            error: error as Error
          });
        }
      }
    }

    return reactionResults;
  }

  // 🔒 EXECUTE INDIVIDUAL POLICY ACTION
  private static async executePolicyAction(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    switch (action.type) {
      case 'create_entity':
        return await this.executeCreateEntityAction(action, context);
      
      case 'update_entity':
        return await this.executeUpdateEntityAction(action, context);
      
      case 'create_workflow':
        return await this.executeCreateWorkflowAction(action, context);
      
      case 'send_notification':
        return await this.executeSendNotificationAction(action, context);
      
      case 'schedule_task':
        return await this.executeScheduleTaskAction(action, context);
      
      default:
        return {
          success: false,
          policyId: 'unknown',
          actionType: action.type,
          error: new Error(`Unknown policy action type: ${action.type}`)
        };
    }
  }

  // 🔒 ACTION EXECUTION METHODS

  private static async executeCreateEntityAction(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    if (!action.target.entityType) {
      return {
        success: false,
        policyId: 'unknown',
        actionType: action.type,
        error: new Error('Entity type not specified for create_entity action')
      };
    }

    switch (action.target.entityType) {
      case 'deal':
        return await this.createDealFromPolicy(action, context);
      
      case 'activity':
        return await this.createActivityFromPolicy(action, context);
      
      default:
        return {
          success: false,
          policyId: 'unknown',
          actionType: action.type,
          error: new Error(`Unsupported entity type for creation: ${action.target.entityType}`)
        };
    }
  }

  private static async executeUpdateEntityAction(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    if (!action.target.entityType) {
      return {
        success: false,
        policyId: 'unknown',
        actionType: action.type,
        error: new Error('Entity type not specified for update_entity action')
      };
    }

    switch (action.target.entityType) {
      case 'lead':
        return await this.updateLeadFromPolicy(action, context);
      
      case 'deal':
        return await this.updateDealFromPolicy(action, context);
      
      default:
        return {
          success: false,
          policyId: 'unknown',
          actionType: action.type,
          error: new Error(`Unsupported entity type for update: ${action.target.entityType}`)
        };
    }
  }

  private static async executeCreateWorkflowAction(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    if (!action.target.workflowId) {
      return {
        success: false,
        policyId: 'unknown',
        actionType: action.type,
        error: new Error('Workflow ID not specified for create_workflow action')
      };
    }

    // Create workflow context for policy-triggered workflow
    const workflowContext: WorkflowContext = {
      workflowId: action.target.workflowId,
      userId: 'policy-engine',
      entities: context.entities,
      metadata: {
        ...context.metadata,
        ...action.data,
        triggeredBy: action.type,
        sourceEvent: context.event.type
      },
      timestamp: new Date()
    };

    try {
      const workflowResult = await CRMOrchestrator.executeWorkflow(
        action.target.workflowId,
        workflowContext
      );

      return {
        success: workflowResult.success,
        policyId: 'policy-workflow',
        actionType: action.type,
        result: workflowResult
      };

    } catch (error) {
      return {
        success: false,
        policyId: 'policy-workflow',
        actionType: action.type,
        error: error as Error
      };
    }
  }

  private static async executeSendNotificationAction(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    // In a real implementation, this would integrate with notification services
    const notificationData = {
      type: action.data.type,
      message: action.data.message,
      channels: action.data.channels,
      recipients: this.determineNotificationRecipients(action, context),
      metadata: {
        triggeredBy: 'policy-engine',
        sourceEvent: context.event.type
      }
    };

    console.log(`📧 Policy notification:`, notificationData);

    return {
      success: true,
      policyId: 'policy-notification',
      actionType: action.type,
      result: notificationData
    };
  }

  private static async executeScheduleTaskAction(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    const taskData = {
      type: action.data.type,
      subject: action.data.subject,
      priority: action.data.priority,
      dueInDays: action.data.dueInDays,
      assignedTo: this.determineTaskAssignee(action, context),
      relatedEntity: this.getRelatedEntityForTask(action, context),
      metadata: {
        triggeredBy: 'policy-engine',
        sourceEvent: context.event.type
      }
    };

    console.log(`📅 Policy task scheduled:`, taskData);

    return {
      success: true,
      policyId: 'policy-task',
      actionType: action.type,
      result: taskData
    };
  }

  // 🔒 HELPER METHODS FOR ENTITY CREATION

  private static async createDealFromPolicy(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    const lead = context.entities.lead;
    if (!lead) {
      return {
        success: false,
        policyId: 'policy-deal-creation',
        actionType: action.type,
        error: new Error('Lead not found in context for deal creation')
      };
    }

    const dealData: CreateDealData = {
      leadId: lead.id,
      name: `Auto-created deal for ${lead.firstName} ${lead.lastName}`,
      value: action.data.value || 0,
      currency: action.data.currency || 'USD',
      stage: DealStage.PROSPECTING,
      assignedTo: lead.assignedTo,
      probability: 10
    };

    // Create workflow context for deal creation
    const workflowContext: WorkflowContext = {
      workflowId: 'auto_deal_creation',
      userId: 'policy-engine',
      entities: { lead },
      metadata: {
        dealData,
        source: 'policy_auto_creation',
        priority: action.data.priority || 'medium'
      },
      timestamp: new Date()
    };

    try {
      const workflowResult = await CRMOrchestrator.executeWorkflow(
        'auto_deal_creation',
        workflowContext
      );

      return {
        success: workflowResult.success,
        policyId: 'policy-deal-creation',
        actionType: action.type,
        result: workflowResult
      };

    } catch (error) {
      return {
        success: false,
        policyId: 'policy-deal-creation',
        actionType: action.type,
        error: error as Error
      };
    }
  }

  private static async createActivityFromPolicy(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    const activityData: CreateActivityData = {
      leadId: context.entities.lead?.id,
      dealId: context.entities.deal?.id,
      type: action.data.type || 'note',
      subject: action.data.subject,
      description: action.data.description,
      assignedTo: action.data.assignedTo || 'policy-engine'
    };

    // Create workflow context for activity creation
    const workflowContext: WorkflowContext = {
      workflowId: 'auto_activity_creation',
      userId: 'policy-engine',
      entities: context.entities,
      metadata: {
        activityData,
        source: 'policy_auto_creation'
      },
      timestamp: new Date()
    };

    try {
      const workflowResult = await CRMOrchestrator.executeWorkflow(
        'auto_activity_creation',
        workflowContext
      );

      return {
        success: workflowResult.success,
        policyId: 'policy-activity-creation',
        actionType: action.type,
        result: workflowResult
      };

    } catch (error) {
      return {
        success: false,
        policyId: 'policy-activity-creation',
        actionType: action.type,
        error: error as Error
      };
    }
  }

  private static async updateLeadFromPolicy(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    const lead = context.entities.lead;
    if (!lead) {
      return {
        success: false,
        policyId: 'policy-lead-update',
        actionType: action.type,
        error: new Error('Lead not found in context for update')
      };
    }

    // Create workflow context for lead update
    const workflowContext: WorkflowContext = {
      workflowId: 'auto_lead_update',
      userId: 'policy-engine',
      entities: { lead },
      metadata: {
        updateData: action.data,
        source: 'policy_auto_update'
      },
      timestamp: new Date()
    };

    try {
      const workflowResult = await CRMOrchestrator.executeWorkflow(
        'auto_lead_update',
        workflowContext
      );

      return {
        success: workflowResult.success,
        policyId: 'policy-lead-update',
        actionType: action.type,
        result: workflowResult
      };

    } catch (error) {
      return {
        success: false,
        policyId: 'policy-lead-update',
        actionType: action.type,
        error: error as Error
      };
    }
  }

  private static async updateDealFromPolicy(
    action: PolicyAction,
    context: PolicyContext
  ): Promise<PolicyReactionResult> {
    const deal = context.entities.deal;
    if (!deal) {
      return {
        success: false,
        policyId: 'policy-deal-update',
        actionType: action.type,
        error: new Error('Deal not found in context for update')
      };
    }

    // Create workflow context for deal update
    const workflowContext: WorkflowContext = {
      workflowId: 'auto_deal_update',
      userId: 'policy-engine',
      entities: { deal },
      metadata: {
        updateData: action.data,
        source: 'policy_auto_update'
      },
      timestamp: new Date()
    };

    try {
      const workflowResult = await CRMOrchestrator.executeWorkflow(
        'auto_deal_update',
        workflowContext
      );

      return {
        success: workflowResult.success,
        policyId: 'policy-deal-update',
        actionType: action.type,
        result: workflowResult
      };

    } catch (error) {
      return {
        success: false,
        policyId: 'policy-deal-update',
        actionType: action.type,
        error: error as Error
      };
    }
  }

  // 🔒 HELPER METHODS

  private static determineNotificationRecipients(
    action: PolicyAction,
    context: PolicyContext
  ): string[] {
    // Determine recipients based on policy action and context
    if (action.data.channels?.includes('management')) {
      return ['management@company.com'];
    }

    if (context.entities.deal?.assignedTo) {
      return [context.entities.deal.assignedTo];
    }

    if (context.entities.lead?.assignedTo) {
      return [context.entities.lead.assignedTo];
    }

    return ['system@company.com'];
  }

  private static determineTaskAssignee(
    action: PolicyAction,
    context: PolicyContext
  ): string {
    // Determine task assignee based on context
    if (action.data.assignedTo) {
      return action.data.assignedTo;
    }

    if (context.entities.deal?.assignedTo) {
      return context.entities.deal.assignedTo;
    }

    if (context.entities.lead?.assignedTo) {
      return context.entities.lead.assignedTo;
    }

    return 'unassigned';
  }

  private static getRelatedEntityForTask(
    action: PolicyAction,
    context: PolicyContext
  ): { type: string; id: string } | null {
    if (context.entities.deal) {
      return { type: 'deal', id: context.entities.deal.id };
    }

    if (context.entities.lead) {
      return { type: 'lead', id: context.entities.lead.id };
    }

    return null;
  }
}
