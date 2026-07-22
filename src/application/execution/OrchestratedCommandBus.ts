// APPLICATION LAYER: Orchestrated CommandBus
// Dispatcher-only - no business logic, pure routing to orchestrator

import type { 
  ILeadRepository, 
  IDealRepository, 
  IActivityRepository,
  CreateLeadData,
  UpdateLeadData,
  CreateDealData,
  UpdateDealData,
  CreateActivityData,
  UpdateActivityData,
  Lead,
  Deal,
  Activity
} from '@domain/interfaces/repositories.interface';

import type { 
  IEventPublisher
} from '@domain/interfaces/services.interface';

import { 
  TransactionalCRMEngine,
  TransactionResult,
  IdempotencyKey
} from '@domain/core/TransactionalEngine';

import { 
  CRMOrchestrator,
  WorkflowContext,
  WorkflowResult
} from '@domain/orchestration/CRMOrchestrator';

import { OutboxProcessor } from '@infrastructure/database/OutboxProcessor';

// 🔒 DISPATCHER COMMANDS - Pure routing definitions
export interface OrchestratedCommand {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
  idempotencyKey: string;
  timeoutMs?: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface ICreateLeadOrchestratedCommand extends OrchestratedCommand {
  type: 'create_lead';
  data: CreateLeadData;
}

export interface IConvertLeadOrchestratedCommand extends OrchestratedCommand {
  type: 'convert_lead';
  leadId: string;
  dealData: CreateDealData;
}

export interface IProgressDealOrchestratedCommand extends OrchestratedCommand {
  type: 'progress_deal';
  dealId: string;
  targetStage: string;
  stageData?: Record<string, any>;
}

export interface ICreateActivityOrchestratedCommand extends OrchestratedCommand {
  type: 'create_activity';
  data: CreateActivityData;
}

export type OrchestratedDomainCommand = 
  | ICreateLeadOrchestratedCommand
  | IConvertLeadOrchestratedCommand
  | IProgressDealOrchestratedCommand
  | ICreateActivityOrchestratedCommand;

// 🔒 ORCHESTRATED COMMAND BUS - Pure dispatcher
export class OrchestratedCommandBus {
  private engine: TransactionalCRMEngine;
  private outboxProcessor: OutboxProcessor;

  constructor(
    leadRepo: ILeadRepository,
    dealRepo: IDealRepository,
    activityRepo: IActivityRepository,
    eventPublisher: IEventPublisher
  ) {
    this.engine = new TransactionalCRMEngine(
      leadRepo,
      dealRepo,
      activityRepo,
      eventPublisher
    );
    
    this.outboxProcessor = new OutboxProcessor(eventPublisher);
  }

  // 🚀 START OUTBOX PROCESSOR
  async start(): Promise<void> {
    await this.outboxProcessor.startProcessing();
  }

  // 🚀 STOP OUTBOX PROCESSOR
  async stop(): Promise<void> {
    await this.outboxProcessor.stopProcessing();
  }

  // 🔒 PURE DISPATCHER - Routes to orchestrator, no business logic
  async execute<T = any>(command: OrchestratedDomainCommand): Promise<TransactionResult<T>> {
    const startTime = Date.now();
    const timeout = command.timeoutMs || 30000;

    try {
      // 🔒 STEP 1: Validate command structure only
      this.validateCommand(command);

      // 🔒 STEP 2: Check if this is a retry
      if (command.retryCount && command.retryCount > 0) {
        console.log(`🔄 Retrying orchestrated command: ${command.type} (attempt ${command.retryCount + 1})`);
      }

      // 🔒 STEP 3: Route to appropriate workflow
      const result = await this.executeWithTimeout<T>(command, timeout);

      // 🔒 STEP 4: Log successful execution
      const duration = Date.now() - startTime;
      console.log(`✅ Orchestrated command executed: ${command.type} (${command.id}) - ${duration}ms`);

      return result;

    } catch (error) {
      // 🔒 STEP 5: Handle execution failure
      const duration = Date.now() - startTime;
      console.error(`❌ Orchestrated command failed: ${command.type} (${command.id}) - ${duration}ms`, error);

      // Determine if retry is appropriate
      const shouldRetry = this.shouldRetry(command, error as Error);

      if (shouldRetry) {
        return this.scheduleRetry(command, error as Error);
      }

      return {
        success: false,
        error: error as Error,
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }
  }

  // 🔒 EXECUTE WITH TIMEOUT PROTECTION
  private async executeWithTimeout<T>(
    command: OrchestratedDomainCommand,
    timeoutMs: number
  ): Promise<TransactionResult<T>> {
    const timeoutPromise = new Promise<TransactionResult<T>>((_, reject) => {
      setTimeout(() => reject(new Error(`Orchestrated command execution timeout: ${timeoutMs}ms`)), timeoutMs);
    });

    const executionPromise = this.executeCommand<T>(command);

    const result = await Promise.race([executionPromise, timeoutPromise]);
    return result as TransactionResult<T>;
  }

  // 🔒 PURE ROUTING LOGIC - No business decisions
  private async executeCommand<T>(command: OrchestratedDomainCommand): Promise<TransactionResult<T>> {
    let result: TransactionResult<T>;

    switch (command.type) {
      case 'create_lead':
        result = await this.routeToLeadCreation(command as ICreateLeadOrchestratedCommand) as TransactionResult<T>;
        break;

      case 'convert_lead':
        result = await this.routeToLeadConversion(command as IConvertLeadOrchestratedCommand) as TransactionResult<T>;
        break;

      case 'progress_deal':
        result = await this.routeToDealProgression(command as IProgressDealOrchestratedCommand) as TransactionResult<T>;
        break;

      case 'create_activity':
        result = await this.routeToActivityCreation(command as ICreateActivityOrchestratedCommand) as TransactionResult<T>;
        break;

      default:
        throw new Error(`Unknown orchestrated command type: ${(command as any).type}`);
    }

    return result as TransactionResult<T>;
  }

  // 🔒 ROUTING METHODS - Pure dispatch to orchestrator

  private async routeToLeadCreation(command: ICreateLeadOrchestratedCommand): Promise<TransactionResult<Lead>> {
    // Create workflow context
    const workflowContext: WorkflowContext = {
      workflowId: 'lead_creation',
      userId: command.userId,
      entities: {},
      metadata: { 
        leadData: command.data,
        idempotencyKey: command.idempotencyKey
      },
      timestamp: new Date()
    };

    // Route to orchestrator - NO business logic here
    const workflowResult = await CRMOrchestrator.executeWorkflow(
      'lead_creation',
      workflowContext
    );

    if (!workflowResult.success) {
      return {
        success: false,
        error: workflowResult.error || new Error('Lead creation workflow failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: this.isRetryableError(workflowResult.error)
      };
    }

    return {
      success: true,
      data: workflowResult.entities?.lead,
      transactionId: command.id,
      eventsEmitted: [],
      rollbackOccurred: false,
      retryable: false
    };
  }

  private async routeToLeadConversion(command: IConvertLeadOrchestratedCommand): Promise<TransactionResult<Deal>> {
    // Create workflow context
    const workflowContext: WorkflowContext = {
      workflowId: 'lead_conversion',
      userId: command.userId,
      entities: {},
      metadata: { 
        leadId: command.leadId,
        dealData: command.dealData,
        idempotencyKey: command.idempotencyKey
      },
      timestamp: new Date()
    };

    // Route to orchestrator - NO business logic here
    const workflowResult = await CRMOrchestrator.executeWorkflow(
      'lead_conversion',
      workflowContext
    );

    if (!workflowResult.success) {
      return {
        success: false,
        error: workflowResult.error || new Error('Lead conversion workflow failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: this.isRetryableError(workflowResult.error)
      };
    }

    return {
      success: true,
      data: workflowResult.entities?.deal,
      transactionId: command.id,
      eventsEmitted: [],
      rollbackOccurred: false,
      retryable: false
    };
  }

  private async routeToDealProgression(command: IProgressDealOrchestratedCommand): Promise<TransactionResult<Deal>> {
    // Create workflow context
    const workflowContext: WorkflowContext = {
      workflowId: 'deal_stage_progression',
      userId: command.userId,
      entities: {},
      metadata: { 
        dealId: command.dealId,
        targetStage: command.targetStage,
        stageData: command.stageData,
        idempotencyKey: command.idempotencyKey
      },
      timestamp: new Date()
    };

    // Route to orchestrator - NO business logic here
    const workflowResult = await CRMOrchestrator.executeWorkflow(
      'deal_stage_progression',
      workflowContext
    );

    if (!workflowResult.success) {
      return {
        success: false,
        error: workflowResult.error || new Error('Deal progression workflow failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: this.isRetryableError(workflowResult.error)
      };
    }

    return {
      success: true,
      data: workflowResult.entities?.deal,
      transactionId: command.id,
      eventsEmitted: [],
      rollbackOccurred: false,
      retryable: false
    };
  }

  private async routeToActivityCreation(command: ICreateActivityOrchestratedCommand): Promise<TransactionResult<Activity>> {
    // Create workflow context
    const workflowContext: WorkflowContext = {
      workflowId: 'activity_creation',
      userId: command.userId,
      entities: {},
      metadata: { 
        activityData: command.data,
        idempotencyKey: command.idempotencyKey
      },
      timestamp: new Date()
    };

    // Route to orchestrator - NO business logic here
    const workflowResult = await CRMOrchestrator.executeWorkflow(
      'activity_creation',
      workflowContext
    );

    if (!workflowResult.success) {
      return {
        success: false,
        error: workflowResult.error || new Error('Activity creation workflow failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: this.isRetryableError(workflowResult.error)
      };
    }

    return {
      success: true,
      data: workflowResult.entities?.activity,
      transactionId: command.id,
      eventsEmitted: [],
      rollbackOccurred: false,
      retryable: false
    };
  }

  // 🔒 PURE VALIDATION - Structure only, no business rules
  private validateCommand(command: OrchestratedDomainCommand): void {
    if (!command.id) {
      throw new Error('Orchestrated command must have an id');
    }
    if (!command.type) {
      throw new Error('Orchestrated command must have a type');
    }
    if (!command.timestamp) {
      throw new Error('Orchestrated command must have a timestamp');
    }
    if (!command.idempotencyKey) {
      throw new Error('Orchestrated command must have an idempotency key');
    }
    if (command.timeoutMs && command.timeoutMs <= 0) {
      throw new Error('Command timeout must be positive');
    }
    if (command.maxRetries && command.maxRetries < 0) {
      throw new Error('Max retries cannot be negative');
    }
  }

  // 🔒 RETRY LOGIC - Pure infrastructure concern
  private shouldRetry(command: OrchestratedDomainCommand, error: Error): boolean {
    const currentRetryCount = command.retryCount || 0;
    const maxRetries = command.maxRetries || 3;

    if (currentRetryCount >= maxRetries) {
      return false;
    }

    return this.isRetryableError(error);
  }

  private isRetryableError(error?: Error): boolean {
    if (!error) return false;
    
    const retryableErrors = [
      /connection/i,
      /timeout/i,
      /deadlock/i,
      /lock wait timeout/i,
      /network/i,
      /temporary/i
    ];

    return retryableErrors.some(pattern => pattern.test(error.message));
  }

  // 🔒 SCHEDULE RETRY - Pure infrastructure
  private scheduleRetry<T>(
    command: OrchestratedDomainCommand,
    error: Error
  ): TransactionResult<T> {
    const retryCount = (command.retryCount || 0) + 1;
    const delayMs = Math.min(1000 * Math.pow(2, retryCount), 30000);

    console.log(`🔄 Scheduling retry for ${command.type} in ${delayMs}ms (attempt ${retryCount})`);

    setTimeout(async () => {
      const retryCommand = {
        ...command,
        retryCount,
        timestamp: new Date()
      };

      try {
        await this.execute(retryCommand);
      } catch (retryError) {
        console.error(`❌ Retry failed for ${command.type}:`, retryError);
      }
    }, delayMs);

    return {
      success: false,
      error,
      transactionId: command.id,
      eventsEmitted: [],
      rollbackOccurred: true,
      retryable: true
    };
  }

  // 🔒 HEALTH CHECK
  async getHealthStatus(): Promise<{
    isProcessing: boolean;
    pendingEvents: number;
    failedEvents: number;
    oldestPendingEvent?: Date;
  }> {
    return await this.outboxProcessor.getHealthStatus();
  }

  // 🔒 MANUAL REPROCESSING
  async reprocessFailedEvents(eventIds?: string[]): Promise<void> {
    await this.outboxProcessor.reprocessFailedEvents(eventIds);
  }
}
