import { prisma } from '@/lib/prisma';
import { eventBus, EVENTS } from '../events/event-bus';

/**
 * ENTERPRISE WORKFLOW ENGINE
 * Automates business logic based on system events.
 */

export class WorkflowEngine {
  private static instance: WorkflowEngine;

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Initialize the engine by subscribing to all relevant events.
   */
  public init() {
    console.log('[WorkflowEngine] Initializing...');

    // Subscribe to major events
    Object.values(EVENTS).forEach(moduleEvents => {
      Object.values(moduleEvents).forEach(eventType => {
        eventBus.subscribe(eventType, (payload) => this.handleEvent(eventType, payload));
      });
    });
  }

  /**
   * Handle an event by finding and executing matching workflows.
   */
  private async handleEvent(eventType: string, payload: any) {
    const { organizationId, id: entityId } = payload;
    if (!organizationId) return;

    try {
      // Find active workflows for this trigger type
      const workflows = await prisma.workflow.findMany({
        where: {
          organizationId,
          isActive: true,
          triggers: {
            some: { type: eventType }
          }
        },
        include: {
          actions: { orderBy: { order: 'asc' } },
          triggers: true
        }
      });

      for (const workflow of workflows) {
        console.log(`[WorkflowEngine] Executing workflow: ${workflow.name} for event ${eventType}`);
        await this.executeWorkflow(workflow, payload);
      }
    } catch (err) {
      console.error('[WorkflowEngine] Event handling failed:', err);
    }
  }

  /**
   * Execute a specific workflow's actions.
   */
  private async executeWorkflow(workflow: any, payload: any) {
    const logs: any[] = [];
    
    try {
      for (const action of workflow.actions) {
        logs.push({ action: action.type, startedAt: new Date() });
        
        // Execute action based on type
        switch (action.type) {
          case 'send_notification':
            await this.performNotificationAction(action.config, payload, workflow.organizationId);
            break;
          case 'create_task':
            await this.performTaskAction(action.config, payload, workflow.organizationId);
            break;
          // Add more action types here (webhooks, email, etc.)
          default:
            console.warn(`[WorkflowEngine] Unknown action type: ${action.type}`);
        }
        
        logs[logs.length - 1].status = 'SUCCESS';
      }

      // Log successful execution
      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          entityId: payload.id,
          status: 'SUCCESS',
          logs: logs
        }
      });

    } catch (err: any) {
      console.error(`[WorkflowEngine] Workflow ${workflow.name} failed:`, err);
      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          entityId: payload.id,
          status: 'FAILED',
          logs: [...logs, { error: err.message, failedAt: new Date() }]
        }
      });
    }
  }

  private async performNotificationAction(config: any, payload: any, organizationId: string) {
    // Logic to create a notification
    await prisma.notification.create({
      data: {
        organizationId,
        userId: payload.userId || config.userId,
        title: config.title || 'Workflow Action',
        message: config.message || 'A workflow action was triggered.',
        type: 'info'
      }
    });
  }

  private async performTaskAction(config: any, payload: any, organizationId: string) {
    // Logic to create a task
    await prisma.task.create({
      data: {
        organizationId,
        title: config.title || 'Workflow Task',
        description: config.description,
        assigneeId: config.assigneeId || payload.userId,
        creatorId: 'SYSTEM', // System created
        entityType: payload.type || 'WORKFLOW',
        entityId: payload.id
      }
    });
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
