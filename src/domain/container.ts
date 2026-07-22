// Dependency Inversion Container - Enforces Domain Boundaries
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '@/lib/utils/error';
import { DomainEngine } from './execute';
import { PrismaLeadRepository } from './infrastructure/repositories/lead.repository';
import { PrismaDealRepository } from './infrastructure/repositories/deal.repository';
import { PrismaActivityRepository } from './infrastructure/repositories/activity.repository';
import { EventOutbox } from './infrastructure/events/event-outbox';

// Service Interfaces - Domain defines contracts
export interface ILeadRepository {
  findById(id: string, workspaceId: string): Promise<any>;
  findByEmail(email: string, workspaceId: string): Promise<any>;
  create(lead: any): Promise<any>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string, workspaceId: string): Promise<void>;
  findMany(workspaceId: string, filters: any): Promise<any[]>;
}

export interface IDealRepository {
  findById(id: string, workspaceId: string): Promise<any>;
  findByLeadId(leadId: string, workspaceId: string): Promise<any[]>;
  create(deal: any): Promise<any>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string, workspaceId: string): Promise<void>;
  findMany(workspaceId: string, filters: any): Promise<any[]>;
}

export interface IActivityRepository {
  create(activity: any): Promise<any>;
  findByEntity(aggregateId: string, workspaceId: string): Promise<any[]>;
  findMany(workspaceId: string, filters: any): Promise<any[]>;
}

export interface IEventOutbox {
  publish(events: any[]): Promise<void>;
  processOutbox(): Promise<void>;
}

// Dependency Container - Enforces architectural boundaries
export class DomainContainer {
  private static instance: DomainContainer;
  private services = new Map<string, any>();
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
    this.initializeServices();
  }

  static getInstance(): DomainContainer {
    if (!DomainContainer.instance) {
      DomainContainer.instance = new DomainContainer();
    }
    return DomainContainer.instance;
  }

  private initializeServices(): void {
    // Infrastructure layer - Hidden from domain
    const leadRepo = new PrismaLeadRepository(this.prisma);
    const dealRepo = new PrismaDealRepository(this.prisma);
    const activityRepo = new PrismaActivityRepository(this.prisma);
    const eventOutbox = new EventOutbox(this.prisma);

    // Domain layer - Only uses interfaces
    const domainEngine = new DomainEngine(
      leadRepo as ILeadRepository,
      dealRepo as IDealRepository,
      activityRepo as IActivityRepository
    );

    // Register services - Only accessible through container
    this.services.set('domainEngine', domainEngine);
    this.services.set('eventOutbox', eventOutbox);
    this.services.set('prisma', this.prisma);
  }

  // Service resolution - Enforces dependency inversion
  resolve<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not registered in container`);
    }
    return service as T;
  }

  // Factory methods - Prevent direct instantiation
  static createDomainEngine(): DomainEngine {
    return DomainContainer.getInstance().resolve<DomainEngine>('domainEngine');
  }

  static createEventOutbox(): IEventOutbox {
    return DomainContainer.getInstance().resolve<IEventOutbox>('eventOutbox');
  }

  static createPrismaClient(): PrismaClient {
    return DomainContainer.getInstance().resolve<PrismaClient>('prisma');
  }

  // Health check - Container integrity
  async healthCheck(): Promise<{
    database: boolean;
    services: boolean;
    details: any;
  }> {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      const database = true;
    } catch (error) {
      return {
        database: false,
        services: false,
        details: { error: getErrorMessage(error) }
      };
    }

    return {
      database: true,
      services: true,
      details: {
        registeredServices: Array.from(this.services.keys())
      }
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export factory functions - Only way to access services
export const createDomainEngine = () => DomainContainer.createDomainEngine();
export const createEventOutbox = () => DomainContainer.createEventOutbox();
export const createPrismaClient = () => DomainContainer.createPrismaClient();

// Prevent direct imports of infrastructure
export { 
  PrismaLeadRepository, 
  PrismaDealRepository, 
  PrismaActivityRepository 
} from './infrastructure/repositories';

export { EventOutbox } from './infrastructure/events/event-outbox';
