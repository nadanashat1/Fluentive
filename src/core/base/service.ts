// Enterprise Service Layer Pattern
// Abstract base class for all domain services

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { eventBus, Event } from '@/services/event-bus';
import { AppError } from './error';

export interface ServiceContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export abstract class BaseService<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  // Get the Prisma model delegate
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  // Validate tenant context
  protected validateContext(context: ServiceContext): void {
    if (!context.tenantId) {
      throw new AppError('Tenant ID is required', 400);
    }
  }

  // Apply tenant filter to queries
  protected withTenant(where: any = {}, context: ServiceContext): any {
    this.validateContext(context);
    return {
      ...where,
      tenantId: context.tenantId
    };
  }

  // Apply pagination
  protected getPagination(options: QueryOptions): { skip: number; take: number } {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Max 100 per page
    
    return {
      skip: (page - 1) * limit,
      take: limit
    };
  }

  // Apply sorting
  protected getOrderBy(options: QueryOptions): any {
    if (!options.sortBy) return { createdAt: 'desc' };
    
    return {
      [options.sortBy]: options.sortOrder || 'desc'
    };
  }

  // Publish domain event
  protected async publishEvent(
    type: string,
    payload: Record<string, unknown>,
    context: ServiceContext
  ): Promise<void> {
    const event: Event = {
      type,
      payload,
      timestamp: new Date(),
      service: this.constructor.name,
      tenantId: context.tenantId,
      userId: context.userId
    };

    await eventBus.publish(event);
  }

  // Abstract CRUD methods to be implemented by specific services
  abstract findAll(options: QueryOptions, context: ServiceContext): Promise<PaginatedResult<T>>;
  abstract findById(id: string, context: ServiceContext): Promise<T | null>;
  abstract create(data: any, context: ServiceContext): Promise<T>;
  abstract update(id: string, data: any, context: ServiceContext): Promise<T>;
  abstract delete(id: string, context: ServiceContext): Promise<void>;
}
