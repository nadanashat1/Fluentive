// DOMAIN LAYER: CRM Domain Orchestrator
// Coordinates cross-entity workflows - owns multi-aggregate business rules

import type { 
  Lead,
  Deal,
  Activity,
  CreateLeadData,
  CreateDealData,
  CreateActivityData
} from '@domain/interfaces/repositories.interface';

import { 
  LeadStatus,
  DealStage
} from '@domain/interfaces/repositories.interface';

import { 
  LeadStateMachine,
  LeadTransitionContext,
  LeadStateMachineResult
} from '@domain/state-machines/LeadStateMachine';

import { 
  DealStateMachine,
  DealTransitionContext,
  DealStateMachineResult
} from '@domain/state-machines/DealStateMachine';

// 🔒 CROSS-ENTITY WORKFLOW DEFINITIONS
export interface CRMWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  compensation?: CompensationStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  entityType: 'lead' | 'deal' | 'activity';
  action: string;
  requires?: string[];
  provides?: string[];
}

export interface CompensationStep {
  stepId: string;
  action: string;
  condition?: string;
}

export interface WorkflowContext {
  workflowId: string;
  userId?: string;
  entities: {
    lead?: Lead;
    deal?: Deal;
    activity?: Activity;
  };
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface WorkflowResult {
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: Error;
  compensations?: string[];
  entities?: {
    lead?: Lead;
    deal?: Deal;
    activity?: Activity;
  };
}

// 🔒 CRM ORCHESTRATOR - Cross-entity coordination only
export class CRMOrchestrator {
  private static readonly WORKFLOWS: Map<string, CRMWorkflow> = new Map([
    ['lead_conversion', {
      id: 'lead_conversion',
      name: 'Lead to Deal Conversion',
      description: 'Converts a qualified lead into a deal with proper state coordination',
      steps: [
        {
          id: 'validate_lead_conversion',
          name: 'Validate Lead Conversion Eligibility',
          entityType: 'lead',
          action: 'validate_conversion',
          requires: ['lead_qualified']
        },
        {
          id: 'create_deal',
          name: 'Create Deal from Lead',
          entityType: 'deal',
          action: 'create_from_lead',
          requires: ['lead_conversion_validated']
        },
        {
          id: 'convert_lead_status',
          name: 'Convert Lead Status',
          entityType: 'lead',
          action: 'convert_status',
          requires: ['deal_created']
        },
        {
          id: 'log_conversion_activity',
          name: 'Log Conversion Activity',
          entityType: 'activity',
          action: 'create_conversion_log',
          requires: ['lead_converted', 'deal_created']
        }
      ],
      compensation: [
        {
          stepId: 'create_deal',
          action: 'delete_created_deal',
          condition: 'deal_created'
        },
        {
          stepId: 'convert_lead_status',
          action: 'revert_lead_status',
          condition: 'lead_converted'
        }
      ]
    }],
    
    ['deal_stage_progression', {
      id: 'deal_stage_progression',
      name: 'Deal Stage Progression',
      description: 'Moves deal through stages with proper validation',
      steps: [
        {
          id: 'validate_stage_transition',
          name: 'Validate Stage Transition',
          entityType: 'deal',
          action: 'validate_transition',
          requires: ['deal_exists']
        },
        {
          id: 'update_deal_stage',
          name: 'Update Deal Stage',
          entityType: 'deal',
          action: 'update_stage',
          requires: ['stage_transition_validated']
        },
        {
          id: 'log_stage_activity',
          name: 'Log Stage Change Activity',
          entityType: 'activity',
          action: 'create_stage_log',
          requires: ['deal_stage_updated']
        }
      ]
    }]
  ]);

  // 🔒 MAIN ORCHESTRATION ENTRY POINT
  static async executeWorkflow(
    workflowId: string,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const workflow = this.WORKFLOWS.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        completedSteps: [],
        error: new Error(`Workflow ${workflowId} not found`)
      };
    }

    console.log(`🚀 Starting CRM workflow: ${workflow.name}`);
    const completedSteps: string[] = [];
    const compensations: string[] = [];

    try {
      for (const step of workflow.steps) {
        console.log(`📋 Executing workflow step: ${step.name}`);
        
        const stepResult = await this.executeWorkflowStep(step, context);
        
        if (!stepResult.success) {
          console.error(`❌ Workflow step failed: ${step.name}`, stepResult.error);
          
          // Execute compensations if available
          const compensationResult = await this.executeCompensations(
            workflow.compensation || [],
            completedSteps,
            context
          );
          
          return {
            success: false,
            completedSteps,
            failedStep: step.id,
            error: stepResult.error,
            compensations: compensationResult.executed,
            entities: context.entities
          };
        }

        completedSteps.push(step.id);
        
        // Update context with step results
        if (stepResult.entities) {
          context.entities = { ...context.entities, ...stepResult.entities };
        }
      }

      console.log(`✅ Workflow completed: ${workflow.name}`);
      return {
        success: true,
        completedSteps,
        entities: context.entities
      };

    } catch (error) {
      console.error(`💥 Workflow execution failed: ${workflow.name}`, error);
      
      // Execute compensations
      const compensationResult = await this.executeCompensations(
        workflow.compensation || [],
        completedSteps,
        context
      );

      return {
        success: false,
        completedSteps,
        error: error as Error,
        compensations: compensationResult.executed,
        entities: context.entities
      };
    }
  }

  // 🔒 EXECUTE INDIVIDUAL WORKFLOW STEP
  private static async executeWorkflowStep(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error; entities?: any }> {
    try {
      switch (step.action) {
        case 'validate_conversion':
          return await this.validateLeadConversion(context);
        
        case 'create_from_lead':
          return await this.createDealFromLead(context);
        
        case 'convert_status':
          return await this.convertLeadStatus(context);
        
        case 'create_conversion_log':
          return await this.createConversionActivity(context);
        
        case 'validate_transition':
          return await this.validateDealTransition(context);
        
        case 'update_stage':
          return await this.updateDealStage(context);
        
        case 'create_stage_log':
          return await this.createStageActivity(context);
        
        default:
          return {
            success: false,
            error: new Error(`Unknown workflow action: ${step.action}`)
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error
      };
    }
  }

  // 🔒 WORKFLOW STEP IMPLEMENTATIONS

  private static async validateLeadConversion(
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error }> {
    if (!context.entities.lead) {
      return {
        success: false,
        error: new Error('Lead not found in context')
      };
    }

    const lead = context.entities.lead;
    
    // Validate lead state using LeadStateMachine
    const transitionContext: LeadTransitionContext = {
      entityId: lead.id,
      userId: context.userId,
      currentState: lead.status,
      targetState: LeadStatus.CONVERTED,
      timestamp: new Date()
    };

    const stateResult = await LeadStateMachine.canTransition(
      lead.status,
      LeadStatus.CONVERTED,
      'convert_lead',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'Lead conversion not allowed')
      };
    }

    return { success: true };
  }

  private static async createDealFromLead(
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error; entities?: { deal?: Deal } }> {
    if (!context.entities.lead) {
      return {
        success: false,
        error: new Error('Lead not found in context')
      };
    }

    const lead = context.entities.lead;
    const dealData = context.metadata.dealData as CreateDealData;
    
    if (!dealData) {
      return {
        success: false,
        error: new Error('Deal data not provided in context metadata')
      };
    }

    // Create deal (this would use repository in real implementation)
    const deal: Deal = {
      id: `deal_${Date.now()}`,
      leadId: lead.id,
      name: dealData.name,
      value: dealData.value,
      currency: dealData.currency,
      stage: DealStage.PROSPECTING,
      probability: 10,
      assignedTo: dealData.assignedTo,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      entities: { deal }
    };
  }

  private static async convertLeadStatus(
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error; entities?: { lead?: Lead } }> {
    if (!context.entities.lead) {
      return {
        success: false,
        error: new Error('Lead not found in context')
      };
    }

    const lead = context.entities.lead;
    
    // Apply transition using LeadStateMachine
    const transitionContext: LeadTransitionContext = {
      entityId: lead.id,
      userId: context.userId,
      metadata: { dealCreationInitiated: true },
      currentState: lead.status,
      targetState: LeadStatus.CONVERTED,
      timestamp: new Date()
    };

    const stateResult = await LeadStateMachine.applyTransition(
      lead.status,
      LeadStatus.CONVERTED,
      'convert_lead',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'Lead conversion failed')
      };
    }

    const updatedLead: Lead = {
      ...lead,
      status: LeadStatus.CONVERTED,
      updatedAt: new Date()
    };

    return {
      success: true,
      entities: { lead: updatedLead }
    };
  }

  private static async createConversionActivity(
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error; entities?: { activity?: Activity } }> {
    const { lead, deal } = context.entities;
    
    if (!lead || !deal) {
      return {
        success: false,
        error: new Error('Both lead and deal required for conversion activity')
      };
    }

    const activity: Activity = {
      id: `activity_${Date.now()}`,
      leadId: lead.id,
      dealId: deal.id,
      type: 'note' as any,
      subject: 'Lead Converted to Deal',
      description: `Lead ${lead.email} converted to deal ${deal.name}`,
      assignedTo: context.userId || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      entities: { activity }
    };
  }

  private static async validateDealTransition(
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error }> {
    if (!context.entities.deal) {
      return {
        success: false,
        error: new Error('Deal not found in context')
      };
    }

    const deal = context.entities.deal;
    const targetStage = context.metadata.targetStage as DealStage;
    
    if (!targetStage) {
      return {
        success: false,
        error: new Error('Target stage not provided in context metadata')
      };
    }

    // Validate deal transition using DealStateMachine
    const transitionContext: DealTransitionContext = {
      entityId: deal.id,
      userId: context.userId,
      currentState: deal.stage,
      targetState: targetStage,
      timestamp: new Date()
    };

    const stateResult = await DealStateMachine.canTransition(
      deal.stage,
      targetStage,
      'stage_change',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'Deal transition not allowed')
      };
    }

    return { success: true };
  }

  private static async updateDealStage(
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error; entities?: { deal?: Deal } }> {
    if (!context.entities.deal) {
      return {
        success: false,
        error: new Error('Deal not found in context')
      };
    }

    const deal = context.entities.deal;
    const targetStage = context.metadata.targetStage as DealStage;
    
    // Apply transition using DealStateMachine
    const transitionContext: DealTransitionContext = {
      entityId: deal.id,
      userId: context.userId,
      currentState: deal.stage,
      targetState: targetStage,
      timestamp: new Date()
    };

    const stateResult = await DealStateMachine.applyTransition(
      deal.stage,
      targetStage,
      'stage_change',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'Deal stage update failed')
      };
    }

    const updatedDeal: Deal = {
      ...deal,
      stage: targetStage,
      updatedAt: new Date()
    };

    return {
      success: true,
      entities: { deal: updatedDeal }
    };
  }

  private static async createStageActivity(
    context: WorkflowContext
  ): Promise<{ success: boolean; error?: Error; entities?: { activity?: Activity } }> {
    const deal = context.entities.deal;
    
    if (!deal) {
      return {
        success: false,
        error: new Error('Deal not found in context')
      };
    }

    const activity: Activity = {
      id: `activity_${Date.now()}`,
      dealId: deal.id,
      type: 'note' as any,
      subject: `Deal moved to ${deal.stage}`,
      description: `Deal ${deal.name} progressed to ${deal.stage} stage`,
      assignedTo: context.userId || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      entities: { activity }
    };
  }

  // 🔒 COMPENSATION EXECUTION
  private static async executeCompensations(
    compensations: CompensationStep[],
    completedSteps: string[],
    context: WorkflowContext
  ): Promise<{ executed: string[]; errors: string[] }> {
    const executed: string[] = [];
    const errors: string[] = [];

    // Execute compensations in reverse order
    for (const compensation of compensations.reverse()) {
      if (completedSteps.includes(compensation.stepId)) {
        try {
          console.log(`🔄 Executing compensation for step: ${compensation.stepId}`);
          
          // Execute compensation logic would go here
          // For now, just log the compensation
          executed.push(compensation.stepId);
          
        } catch (error) {
          console.error(`❌ Compensation failed for step: ${compensation.stepId}`, error);
          errors.push(`${compensation.stepId}: ${(error as Error).message}`);
        }
      }
    }

    return { executed, errors };
  }

  // 🔒 WORKFLOW DISCOVERY
  static getAvailableWorkflows(): CRMWorkflow[] {
    return Array.from(this.WORKFLOWS.values());
  }

  static getWorkflow(workflowId: string): CRMWorkflow | undefined {
    return this.WORKFLOWS.get(workflowId);
  }
}
