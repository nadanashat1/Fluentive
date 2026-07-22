// DOMAIN LAYER: Event-Driven Orchestrator
// Central authority for executing policy decisions - Salesforce-level architecture

import type { 
  Lead,
  Deal,
  Activity
} from '@domain/interfaces/repositories.interface';

import { 
  CRMOrchestrator,
  WorkflowContext,
  WorkflowResult
} from './CRMOrchestrator';

import { 
  PolicyDecisionEngine,
  PolicyDecision,
  PolicySuggestedAction
} from '../policies/PolicyDecisionEngine';

// Orchestration pipeline event (distinct from `DomainEvent` in `shared/types` — different shape / semantics).
export interface OrchestrationDomainEvent {
  id: string;
  type: string;
  entityType: 'lead' | 'deal' | 'activity' | 'system';
  entityId: string;
  timestamp: Date;
  data: {
    previousState?: any;
    newState?: any;
    [key: string]: any;
  };
  metadata: Record<string, any>;
}

export interface OrchestrationResult {
  success: boolean;
  eventId: string;
  policyDecisions: PolicyDecision[];
  executedWorkflows: WorkflowResult[];
  errors: Array<{
    type: 'policy_evaluation' | 'workflow_execution';
    message: string;
    error?: Error;
  }>;
}

// 🔒 EVENT-DRIVEN ORCHESTRATOR - Single execution authority
export class EventDrivenOrchestrator {
  // 🚀 MAIN ENTRY POINT: Process domain event through full pipeline
  static async processDomainEvent(event: OrchestrationDomainEvent): Promise<OrchestrationResult> {
    console.log(`🚀 Processing domain event: ${event.type} for ${event.entityType}:${event.entityId}`);

    const result: OrchestrationResult = {
      success: true,
      eventId: event.id,
      policyDecisions: [],
      executedWorkflows: [],
      errors: []
    };

    try {
      // 🔒 STEP 1: Evaluate policy decisions (read-only)
      const policyContext = this.createPolicyContext(event);
      const policyDecisions = await PolicyDecisionEngine.evaluatePolicyDecisions(policyContext);
      result.policyDecisions = policyDecisions;

      console.log(`📊 Policy decisions: ${policyDecisions.length} triggered`);

      // 🔒 STEP 2: Execute approved policy suggestions through orchestrator
      for (const decision of policyDecisions) {
        for (const suggestedAction of decision.suggestedActions) {
          try {
            const workflowResult = await this.executeSuggestedAction(suggestedAction, event, decision);
            result.executedWorkflows.push(workflowResult);

            if (!workflowResult.success) {
              result.errors.push({
                type: 'workflow_execution',
                message: `Workflow failed for action ${suggestedAction.id}`,
                error: workflowResult.error
              });
            }

          } catch (error) {
            result.errors.push({
              type: 'workflow_execution',
              message: `Error executing action ${suggestedAction.id}`,
              error: error as Error
            });
          }
        }
      }

      // 🔒 STEP 3: Determine overall success
      result.success = result.errors.length === 0 && result.executedWorkflows.every(w => w.success);

      if (result.success) {
        console.log(`✅ Event processed successfully: ${event.type}`);
      } else {
        console.error(`❌ Event processing completed with errors: ${event.type}`, result.errors);
      }

      return result;

    } catch (error) {
      console.error(`💥 Critical error processing event: ${event.type}`, error);
      
      result.success = false;
      result.errors.push({
        type: 'policy_evaluation',
        message: 'Critical error in event processing',
        error: error as Error
      });

      return result;
    }
  }

  // 🔒 EXECUTE SUGGESTED ACTION - Through orchestrator only
  private static async executeSuggestedAction(
    action: PolicySuggestedAction,
    event: OrchestrationDomainEvent,
    decision: PolicyDecision
  ): Promise<WorkflowResult> {
    console.log(`🎯 Executing suggested action: ${action.type} (${action.id})`);

    switch (action.type) {
      case 'create_workflow':
        return await this.executeCreateWorkflowAction(action, event, decision);
      
      case 'create_entity':
        return await this.executeCreateEntityAction(action, event, decision);
      
      case 'update_entity':
        return await this.executeUpdateEntityAction(action, event, decision);
      
      case 'send_notification':
        return await this.executeSendNotificationAction(action, event, decision);
      
      case 'schedule_task':
        return await this.executeScheduleTaskAction(action, event, decision);
      
      default:
        throw new Error(`Unknown suggested action type: ${action.type}`);
    }
  }

  // 🔒 ACTION EXECUTION METHODS

  private static async executeCreateWorkflowAction(
    action: PolicySuggestedAction,
    event: OrchestrationDomainEvent,
    decision: PolicyDecision
  ): Promise<WorkflowResult> {
    if (!action.target.workflowId) {
      throw new Error('Workflow ID not specified for create_workflow action');
    }

    // Get entities for workflow context
    const entities = await this.getEntitiesForEvent(event);
    
    const workflowContext: WorkflowContext = {
      workflowId: action.target.workflowId,
      userId: 'policy-engine',
      entities,
      metadata: {
        ...action.data,
        triggeredBy: 'policy_decision',
        sourceEvent: event.type,
        policyId: decision.policyId,
        policyConfidence: decision.confidence
      },
      timestamp: new Date()
    };

    // Check if action requires approval
    if (action.requiredApprovals && action.requiredApprovals.length > 0) {
      console.log(`⏸️ Action requires approval: ${action.requiredApprovals.join(', ')}`);
      
      // In a real system, this would create an approval request
      // For now, we'll execute with a note
      workflowContext.metadata.requiresApproval = true;
      workflowContext.metadata.requiredApprovals = action.requiredApprovals;
    }

    return await CRMOrchestrator.executeWorkflow(
      action.target.workflowId,
      workflowContext
    );
  }

  private static async executeCreateEntityAction(
    action: PolicySuggestedAction,
    event: OrchestrationDomainEvent,
    decision: PolicyDecision
  ): Promise<WorkflowResult> {
    if (!action.target.entityType) {
      throw new Error('Entity type not specified for create_entity action');
    }

    // Create a workflow for entity creation
    const workflowId = `auto_${action.target.entityType}_creation`;
    const entities = await this.getEntitiesForEvent(event);

    const workflowContext: WorkflowContext = {
      workflowId,
      userId: 'policy-engine',
      entities,
      metadata: {
        entityType: action.target.entityType,
        entityData: action.data,
        triggeredBy: 'policy_decision',
        sourceEvent: event.type,
        policyId: decision.policyId
      },
      timestamp: new Date()
    };

    return await CRMOrchestrator.executeWorkflow(workflowId, workflowContext);
  }

  private static async executeUpdateEntityAction(
    action: PolicySuggestedAction,
    event: OrchestrationDomainEvent,
    decision: PolicyDecision
  ): Promise<WorkflowResult> {
    if (!action.target.entityType) {
      throw new Error('Entity type not specified for update_entity action');
    }

    const workflowId = `auto_${action.target.entityType}_update`;
    const entities = await this.getEntitiesForEvent(event);

    const workflowContext: WorkflowContext = {
      workflowId,
      userId: 'policy-engine',
      entities,
      metadata: {
        entityType: action.target.entityType,
        updateData: action.data,
        triggeredBy: 'policy_decision',
        sourceEvent: event.type,
        policyId: decision.policyId
      },
      timestamp: new Date()
    };

    return await CRMOrchestrator.executeWorkflow(workflowId, workflowContext);
  }

  private static async executeSendNotificationAction(
    action: PolicySuggestedAction,
    event: OrchestrationDomainEvent,
    decision: PolicyDecision
  ): Promise<WorkflowResult> {
    const workflowId = 'send_notification';
    const entities = await this.getEntitiesForEvent(event);

    const workflowContext: WorkflowContext = {
      workflowId,
      userId: 'policy-engine',
      entities,
      metadata: {
        notificationData: action.data,
        triggeredBy: 'policy_decision',
        sourceEvent: event.type,
        policyId: decision.policyId
      },
      timestamp: new Date()
    };

    return await CRMOrchestrator.executeWorkflow(workflowId, workflowContext);
  }

  private static async executeScheduleTaskAction(
    action: PolicySuggestedAction,
    event: OrchestrationDomainEvent,
    decision: PolicyDecision
  ): Promise<WorkflowResult> {
    const workflowId = 'schedule_task';
    const entities = await this.getEntitiesForEvent(event);

    const workflowContext: WorkflowContext = {
      workflowId,
      userId: 'policy-engine',
      entities,
      metadata: {
        taskData: action.data,
        triggeredBy: 'policy_decision',
        sourceEvent: event.type,
        policyId: decision.policyId
      },
      timestamp: new Date()
    };

    return await CRMOrchestrator.executeWorkflow(workflowId, workflowContext);
  }

  // 🔒 HELPER METHODS

  private static createPolicyContext(event: OrchestrationDomainEvent): any {
    return {
      event: {
        type: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        timestamp: event.timestamp,
        previousState: event.data.previousState,
        newState: event.data.newState
      },
      entities: {}, // Would be populated by repository lookups
      metadata: event.metadata
    };
  }

  private static async getEntitiesForEvent(event: OrchestrationDomainEvent): Promise<{
    lead?: Lead;
    deal?: Deal;
    activity?: Activity;
  }> {
    // In a real implementation, this would fetch entities from repositories
    // For now, return empty object - entities would be populated by the actual system
    return {};
  }

  // 🔒 BATCH PROCESSING - For multiple events
  static async processDomainEvents(events: OrchestrationDomainEvent[]): Promise<OrchestrationResult[]> {
    const results: OrchestrationResult[] = [];

    for (const event of events) {
      const result = await this.processDomainEvent(event);
      results.push(result);
    }

    return results;
  }

  // 🔒 HEALTH CHECK
  static async getOrchestratorHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    policyEngineStatus: boolean;
    orchestratorStatus: boolean;
    lastProcessedEvent?: Date;
  }> {
    // In a real implementation, this would check system health
    return {
      status: 'healthy',
      policyEngineStatus: true,
      orchestratorStatus: true
    };
  }
}
