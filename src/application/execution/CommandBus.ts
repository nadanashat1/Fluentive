// APPLICATION LAYER: Mandatory Domain Execution Pipeline
// This is the ONLY way to execute domain operations - direct repository access is FORBIDDEN

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
  ILeadService,
  IDealService,
  IActivityService
} from '@domain/interfaces/services.interface';

// 🔒 COMMAND INTERFACES - Application layer owns command definitions
export interface ICommand {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
}

export interface ICreateLeadCommand extends ICommand {
  type: 'create_lead';
  data: CreateLeadData;
}

export interface IUpdateLeadCommand extends ICommand {
  type: 'update_lead';
  leadId: string;
  data: UpdateLeadData;
}

export interface ICreateDealCommand extends ICommand {
  type: 'create_deal';
  data: CreateDealData;
}

export interface IUpdateDealCommand extends ICommand {
  type: 'update_deal';
  dealId: string;
  data: UpdateDealData;
}

export interface ICreateActivityCommand extends ICommand {
  type: 'create_activity';
  data: CreateActivityData;
}

export interface IUpdateActivityCommand extends ICommand {
  type: 'update_activity';
  activityId: string;
  data: UpdateActivityData;
}

export type DomainCommand = 
  | ICreateLeadCommand
  | IUpdateLeadCommand
  | ICreateDealCommand
  | IUpdateDealCommand
  | ICreateActivityCommand
  | IUpdateActivityCommand;

// 🔒 COMMAND HANDLERS - Application layer orchestrates domain logic
export class CommandHandler {
  constructor(
    private leadService: ILeadService,
    private dealService: IDealService,
    private activityService: IActivityService
  ) {}

  async execute(command: DomainCommand): Promise<any> {
    // 🚨 MANDATORY EXECUTION FLOW - NO BYPASS ALLOWED
    switch (command.type) {
      case 'create_lead':
        return await this.handleCreateLead(command);
      case 'update_lead':
        return await this.handleUpdateLead(command);
      case 'create_deal':
        return await this.handleCreateDeal(command);
      case 'update_deal':
        return await this.handleUpdateDeal(command);
      case 'create_activity':
        return await this.handleCreateActivity(command);
      case 'update_activity':
        return await this.handleUpdateActivity(command);
      default:
        throw new Error(`Unknown command type: ${(command as any).type}`);
    }
  }

  private async handleCreateLead(command: ICreateLeadCommand): Promise<Lead> {
    // 🚨 ENFORCED: Must go through domain service - NO direct repository access
    return await this.leadService.createLead(command.data);
  }

  private async handleUpdateLead(command: IUpdateLeadCommand): Promise<Lead> {
    return await this.leadService.updateLead(command.leadId, command.data);
  }

  private async handleCreateDeal(command: ICreateDealCommand): Promise<Deal> {
    return await this.dealService.createDeal(command.data);
  }

  private async handleUpdateDeal(command: IUpdateDealCommand): Promise<Deal> {
    return await this.dealService.updateDeal(command.dealId, command.data);
  }

  private async handleCreateActivity(command: ICreateActivityCommand): Promise<Activity> {
    return await this.activityService.createActivity(command.data);
  }

  private async handleUpdateActivity(command: IUpdateActivityCommand): Promise<Activity> {
    return await this.activityService.updateActivity(command.activityId, command.data);
  }
}

// 🔒 COMMAND BUS - SINGLE ENTRY POINT FOR ALL DOMAIN OPERATIONS
export class CommandBus {
  private handler: CommandHandler;

  constructor(handler: CommandHandler) {
    this.handler = handler;
  }

  // 🚨 ONLY WAY TO EXECUTE DOMAIN OPERATIONS
  async execute<T = any>(command: DomainCommand): Promise<T> {
    try {
      // Validate command structure
      this.validateCommand(command);
      
      // Execute through domain services - NO BYPASS POSSIBLE
      const result = await this.handler.execute(command);
      
      // Log successful execution
      console.log(`✅ Command executed: ${command.type} (${command.id})`);
      
      return result;
    } catch (error) {
      // Log execution failure
      console.error(`❌ Command failed: ${command.type} (${command.id})`, error);
      throw error;
    }
  }

  private validateCommand(command: DomainCommand): void {
    if (!command.id) {
      throw new Error('Command must have an id');
    }
    if (!command.type) {
      throw new Error('Command must have a type');
    }
    if (!command.timestamp) {
      throw new Error('Command must have a timestamp');
    }
  }
}

// 🔒 COMMAND FACTORY - Type-safe command creation
export class CommandFactory {
  static createLeadCommand(data: CreateLeadData, userId?: string): ICreateLeadCommand {
    return {
      id: this.generateId(),
      type: 'create_lead',
      timestamp: new Date(),
      data,
      userId
    };
  }

  static updateLeadCommand(leadId: string, data: UpdateLeadData, userId?: string): IUpdateLeadCommand {
    return {
      id: this.generateId(),
      type: 'update_lead',
      timestamp: new Date(),
      leadId,
      data,
      userId
    };
  }

  static createDealCommand(data: CreateDealData, userId?: string): ICreateDealCommand {
    return {
      id: this.generateId(),
      type: 'create_deal',
      timestamp: new Date(),
      data,
      userId
    };
  }

  static updateDealCommand(dealId: string, data: UpdateDealData, userId?: string): IUpdateDealCommand {
    return {
      id: this.generateId(),
      type: 'update_deal',
      timestamp: new Date(),
      dealId,
      data,
      userId
    };
  }

  static createActivityCommand(data: CreateActivityData, userId?: string): ICreateActivityCommand {
    return {
      id: this.generateId(),
      type: 'create_activity',
      timestamp: new Date(),
      data,
      userId
    };
  }

  static updateActivityCommand(activityId: string, data: UpdateActivityData, userId?: string): IUpdateActivityCommand {
    return {
      id: this.generateId(),
      type: 'update_activity',
      timestamp: new Date(),
      activityId,
      data,
      userId
    };
  }

  private static generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 🔒 USAGE EXAMPLE - THIS IS THE ONLY WAY TO INTERACT WITH DOMAIN
/*
// ❌ FORBIDDEN - Direct repository access
// const lead = await leadRepository.create(data);

// ✅ MANDATORY - Command bus execution
const command = CommandFactory.createLeadCommand(data, userId);
const lead = await commandBus.execute(command);
*/
