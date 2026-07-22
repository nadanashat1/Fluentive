// APPLICATION LAYER: State Machine CommandBus
// State-driven architecture - State Machine is the SINGLE authority

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

import { 
  LeadStatus,
  DealStage
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
  CRMTransitionValidator,
  TransitionContext,
  StateMachineResult
} from '@domain/core/CRMStateMachine';

import { OutboxProcessor } from '@infrastructure/database/OutboxProcessor';

// 🔒 STATE MACHINE COMMANDS - Enhanced with state validation
export interface StateMachineCommand {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
  idempotencyKey: string;
  timeoutMs?: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface ICreateLeadStateMachineCommand extends StateMachineCommand {
  type: 'create_lead';
  data: CreateLeadData;
}

export interface IContactLeadStateMachineCommand extends StateMachineCommand {
  type: 'contact_lead';
  leadId: string;
  contactMethod: 'email' | 'phone' | 'meeting' | 'other';
  contactDetails?: string;
}

export interface IQualifyLeadStateMachineCommand extends StateMachineCommand {
  type: 'qualify_lead';
  leadId: string;
  qualificationData: {
    hasBudget: boolean;
    hasAuthority: boolean;
    hasNeed: boolean;
    hasTimeline: boolean;
    notes?: string;
  };
}

export interface IConvertLeadStateMachineCommand extends StateMachineCommand {
  type: 'convert_lead';
  leadId: string;
  dealData: CreateDealData;
}

export interface ILoseLeadStateMachineCommand extends StateMachineCommand {
  type: 'lose_lead';
  leadId: string;
  reason: string;
  details?: string;
}

export interface IStartDealQualificationCommand extends StateMachineCommand {
  type: 'start_deal_qualification';
  dealId: string;
}

export interface ISendDealProposalCommand extends StateMachineCommand {
  type: 'send_deal_proposal';
  dealId: string;
  proposalDetails: {
    title: string;
    value: number;
    currency: string;
    terms?: string;
    validUntil?: Date;
  };
}

export interface IStartDealNegotiationCommand extends StateMachineCommand {
  type: 'start_deal_negotiation';
  dealId: string;
  negotiationDetails: {
    proposalAccepted: boolean;
    terms?: string;
    counterOffer?: number;
  };
}

export interface IWinDealCommand extends StateMachineCommand {
  type: 'win_deal';
  dealId: string;
  finalDetails: {
    contractSigned: boolean;
    finalValue: number;
    closeDate?: Date;
  };
}

export interface ILoseDealCommand extends StateMachineCommand {
  type: 'lose_deal';
  dealId: string;
  reason: string;
  details?: string;
}

export type StateMachineDomainCommand = 
  | ICreateLeadStateMachineCommand
  | IContactLeadStateMachineCommand
  | IQualifyLeadStateMachineCommand
  | IConvertLeadStateMachineCommand
  | ILoseLeadStateMachineCommand
  | IStartDealQualificationCommand
  | ISendDealProposalCommand
  | IStartDealNegotiationCommand
  | IWinDealCommand
  | ILoseDealCommand;

// 🔒 STATE MACHINE COMMAND BUS - State-driven execution
export class StateMachineCommandBus {
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

  // 🔒 EXECUTE COMMAND WITH STATE MACHINE AUTHORITY
  async execute<T = any>(command: StateMachineDomainCommand): Promise<TransactionResult<T>> {
    const startTime = Date.now();
    const timeout = command.timeoutMs || 30000;

    try {
      // 🔒 STEP 1: Validate command
      this.validateStateMachineCommand(command);

      // 🔒 STEP 2: Check if this is a retry
      if (command.retryCount && command.retryCount > 0) {
        console.log(`🔄 Retrying state machine command: ${command.type} (attempt ${command.retryCount + 1})`);
      }

      // 🔒 STEP 3: Execute with timeout
      const result = await this.executeWithTimeout<T>(command, timeout);

      // 🔒 STEP 4: Log successful execution
      const duration = Date.now() - startTime;
      console.log(`✅ State machine command executed: ${command.type} (${command.id}) - ${duration}ms`);

      return result;

    } catch (error) {
      // 🔒 STEP 5: Handle execution failure
      const duration = Date.now() - startTime;
      console.error(`❌ State machine command failed: ${command.type} (${command.id}) - ${duration}ms`, error);

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
    command: StateMachineDomainCommand,
    timeoutMs: number
  ): Promise<TransactionResult<T>> {
    const timeoutPromise = new Promise<TransactionResult<T>>((_, reject) => {
      setTimeout(() => reject(new Error(`State machine command execution timeout: ${timeoutMs}ms`)), timeoutMs);
    });

    const executionPromise = this.executeCommand<T>(command);

    const result = await Promise.race([executionPromise, timeoutPromise]);
    return result as TransactionResult<T>;
  }

  // 🔒 EXECUTE SPECIFIC COMMAND THROUGH STATE MACHINE
  private async executeCommand<T>(command: StateMachineDomainCommand): Promise<TransactionResult<T>> {
    let result: TransactionResult<T>;

    switch (command.type) {
      case 'create_lead':
        result = await this.executeCreateLead(command as ICreateLeadStateMachineCommand) as TransactionResult<T>;
        break;

      case 'contact_lead':
        result = await this.executeContactLead(command as IContactLeadStateMachineCommand) as TransactionResult<T>;
        break;

      case 'qualify_lead':
        result = await this.executeQualifyLead(command as IQualifyLeadStateMachineCommand) as TransactionResult<T>;
        break;

      case 'convert_lead':
        result = await this.executeConvertLead(command as IConvertLeadStateMachineCommand) as TransactionResult<T>;
        break;

      case 'lose_lead':
        result = await this.executeLoseLead(command as ILoseLeadStateMachineCommand) as TransactionResult<T>;
        break;

      case 'start_deal_qualification':
        result = await this.executeStartDealQualification(command as IStartDealQualificationCommand) as TransactionResult<T>;
        break;

      case 'send_deal_proposal':
        result = await this.executeSendDealProposal(command as ISendDealProposalCommand) as TransactionResult<T>;
        break;

      case 'start_deal_negotiation':
        result = await this.executeStartDealNegotiation(command as IStartDealNegotiationCommand) as TransactionResult<T>;
        break;

      case 'win_deal':
        result = await this.executeWinDeal(command as IWinDealCommand) as TransactionResult<T>;
        break;

      case 'lose_deal':
        result = await this.executeLoseDeal(command as ILoseDealCommand) as TransactionResult<T>;
        break;

      default:
        throw new Error(`Unknown state machine command type: ${(command as any).type}`);
    }

    return result as TransactionResult<T>;
  }

  // 🔒 STATE MACHINE EXECUTION METHODS

  private async executeCreateLead(command: ICreateLeadStateMachineCommand): Promise<TransactionResult<Lead>> {
    // Create lead always starts in NEW state
    const transitionContext: TransitionContext = {
      entityId: 'new',
      entityType: 'lead',
      userId: command.userId,
      metadata: { ...command.data },
      currentState: null,
      targetState: LeadStatus.NEW,
      timestamp: new Date()
    };

    // Validate with state machine (for creation invariants)
    const stateResult = await CRMTransitionValidator.validateTransition(
      'lead',
      null as any,
      LeadStatus.NEW,
      'create_lead',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'State machine validation failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }

    // Execute through transactional engine
    return await this.engine.executeLeadCreation(
      command.data,
      command.idempotencyKey,
      command.userId
    );
  }

  private async executeContactLead(command: IContactLeadStateMachineCommand): Promise<TransactionResult<Lead>> {
    // Get current lead state
    const lead = await this.getLeadById(command.leadId);
    if (!lead) {
      throw new Error(`Lead ${command.leadId} not found`);
    }

    const transitionContext: TransitionContext = {
      entityId: command.leadId,
      entityType: 'lead',
      userId: command.userId,
      metadata: { 
        contactMethod: command.contactMethod,
        contactDetails: command.contactDetails
      },
      currentState: lead.status,
      targetState: LeadStatus.CONTACTED,
      timestamp: new Date()
    };

    // 🔒 STATE MACHINE AUTHORITY: Validate transition
    const stateResult = await CRMTransitionValidator.validateTransition(
      'lead',
      lead.status,
      LeadStatus.CONTACTED,
      'contact_lead',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'State machine validation failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }

    // Apply transition through state machine
    const applyResult = await CRMTransitionValidator.applyTransition(
      'lead',
      lead.status,
      LeadStatus.CONTACTED,
      'contact_lead',
      transitionContext
    );

    if (!applyResult.allowed) {
      return {
        success: false,
        error: new Error(applyResult.reason || 'State machine transition failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }

    // Update lead status
    return await this.engine.executeLeadUpdate(
      command.leadId,
      { status: LeadStatus.CONTACTED },
      command.idempotencyKey,
      command.userId
    );
  }

  private async executeQualifyLead(command: IQualifyLeadStateMachineCommand): Promise<TransactionResult<Lead>> {
    const lead = await this.getLeadById(command.leadId);
    if (!lead) {
      throw new Error(`Lead ${command.leadId} not found`);
    }

    const transitionContext: TransitionContext = {
      entityId: command.leadId,
      entityType: 'lead',
      userId: command.userId,
      metadata: command.qualificationData,
      currentState: lead.status,
      targetState: LeadStatus.QUALIFIED,
      timestamp: new Date()
    };

    // 🔒 STATE MACHINE AUTHORITY: Validate transition
    const stateResult = await CRMTransitionValidator.validateTransition(
      'lead',
      lead.status,
      LeadStatus.QUALIFIED,
      'qualify_lead',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'State machine validation failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }

    // Apply transition
    const applyResult = await CRMTransitionValidator.applyTransition(
      'lead',
      lead.status,
      LeadStatus.QUALIFIED,
      'qualify_lead',
      transitionContext
    );

    if (!applyResult.allowed) {
      return {
        success: false,
        error: new Error(applyResult.reason || 'State machine transition failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }

    return await this.engine.executeLeadUpdate(
      command.leadId,
      { status: LeadStatus.QUALIFIED },
      command.idempotencyKey,
      command.userId
    );
  }

  private async executeConvertLead(command: IConvertLeadStateMachineCommand): Promise<TransactionResult<Deal>> {
    const lead = await this.getLeadById(command.leadId);
    if (!lead) {
      throw new Error(`Lead ${command.leadId} not found`);
    }

    const transitionContext: TransitionContext = {
      entityId: command.leadId,
      entityType: 'lead',
      userId: command.userId,
      metadata: { dealCreated: true },
      currentState: lead.status,
      targetState: LeadStatus.CONVERTED,
      timestamp: new Date()
    };

    // 🔒 STATE MACHINE AUTHORITY: Validate transition
    const stateResult = await CRMTransitionValidator.validateTransition(
      'lead',
      lead.status,
      LeadStatus.CONVERTED,
      'convert_lead',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'State machine validation failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }

    // Execute conversion through transactional engine
    return await this.engine.executeLeadConversion(
      command.leadId,
      command.dealData,
      command.idempotencyKey,
      command.userId
    );
  }

  private async executeLoseLead(command: ILoseLeadStateMachineCommand): Promise<TransactionResult<Lead>> {
    const lead = await this.getLeadById(command.leadId);
    if (!lead) {
      throw new Error(`Lead ${command.leadId} not found`);
    }

    const transitionContext: TransitionContext = {
      entityId: command.leadId,
      entityType: 'lead',
      userId: command.userId,
      metadata: { reason: command.reason, details: command.details },
      currentState: lead.status,
      targetState: LeadStatus.LOST,
      timestamp: new Date()
    };

    // 🔒 STATE MACHINE AUTHORITY: Validate transition
    const stateResult = await CRMTransitionValidator.validateTransition(
      'lead',
      lead.status,
      LeadStatus.LOST,
      'lose_lead',
      transitionContext
    );

    if (!stateResult.allowed) {
      return {
        success: false,
        error: new Error(stateResult.reason || 'State machine validation failed'),
        transactionId: command.id,
        eventsEmitted: [],
        rollbackOccurred: true,
        retryable: false
      };
    }

    return await this.engine.executeLeadUpdate(
      command.leadId,
      { status: LeadStatus.LOST },
      command.idempotencyKey,
      command.userId
    );
  }

  // Deal execution methods would follow similar pattern...
  private async executeStartDealQualification(command: IStartDealQualificationCommand): Promise<TransactionResult<Deal>> {
    // Implementation would follow state machine pattern
    throw new Error('Deal operations not yet fully implemented in StateMachineCommandBus');
  }

  private async executeSendDealProposal(command: ISendDealProposalCommand): Promise<TransactionResult<Deal>> {
    throw new Error('Deal operations not yet fully implemented in StateMachineCommandBus');
  }

  private async executeStartDealNegotiation(command: IStartDealNegotiationCommand): Promise<TransactionResult<Deal>> {
    throw new Error('Deal operations not yet fully implemented in StateMachineCommandBus');
  }

  private async executeWinDeal(command: IWinDealCommand): Promise<TransactionResult<Deal>> {
    throw new Error('Deal operations not yet fully implemented in StateMachineCommandBus');
  }

  private async executeLoseDeal(command: ILoseDealCommand): Promise<TransactionResult<Deal>> {
    throw new Error('Deal operations not yet fully implemented in StateMachineCommandBus');
  }

  // 🔒 HELPER METHODS
  private async getLeadById(leadId: string): Promise<Lead | null> {
    // This would use the lead repository
    // For now, return null to indicate need for implementation
    return null;
  }

  private validateStateMachineCommand(command: StateMachineDomainCommand): void {
    if (!command.id) {
      throw new Error('State machine command must have an id');
    }
    if (!command.type) {
      throw new Error('State machine command must have a type');
    }
    if (!command.timestamp) {
      throw new Error('State machine command must have a timestamp');
    }
    if (!command.idempotencyKey) {
      throw new Error('State machine command must have an idempotency key');
    }
  }

  private shouldRetry(command: StateMachineDomainCommand, error: Error): boolean {
    const currentRetryCount = command.retryCount || 0;
    const maxRetries = command.maxRetries || 3;

    if (currentRetryCount >= maxRetries) {
      return false;
    }

    const retryableErrors = [
      /connection/i,
      /timeout/i,
      /deadlock/i,
      /lock wait timeout/i,
      /network/i,
      /temporary/i
    ];

    return retryableErrors.some(pattern => error.message && typeof error.message === 'string' && pattern.test(error.message));
  }

  private scheduleRetry<T>(
    command: StateMachineDomainCommand,
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
