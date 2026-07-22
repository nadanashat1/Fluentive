// Enterprise Repository Layer
// Database access abstraction with tenant isolation

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError, DatabaseError } from './error';

export interface RepositoryContext {
  tenantId: string;
  userId?: string;
}

export interface FindOptions {
  where?: Record<string, unknown>;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
}

export abstract class BaseRepository<T> {
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

  // Validate context has tenantId
  protected validateContext(context: RepositoryContext): void {
    if (!context.tenantId) {
      throw new AppError('Tenant ID is required for all database operations', 400);
    }
  }

  // Add tenant filter to any query
  protected withTenant(
    where: Record<string, unknown> = {},
    context: RepositoryContext
  ): Record<string, unknown> {
    this.validateContext(context);
    return {
      ...where,
      tenantId: context.tenantId
    };
  }

  // Find all with tenant isolation
  async findAll(context: RepositoryContext, options: FindOptions = {}): Promise<T[]> {
    try {
      this.validateContext(context);
      
      return await this.model.findMany({
        where: this.withTenant(options.where, context),
        include: options.include,
        select: options.select,
        orderBy: options.orderBy || { createdAt: 'desc' },
        skip: options.skip,
        take: options.take
      });
    } catch (error) {
      throw new DatabaseError(`Failed to fetch ${this.modelName} records`);
    }
  }

  // Count with tenant isolation
  async count(context: RepositoryContext, where: Record<string, unknown> = {}): Promise<number> {
    try {
      this.validateContext(context);
      
      return await this.model.count({
        where: this.withTenant(where, context)
      });
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.modelName} records`);
    }
  }

  // Find by ID with tenant isolation
  async findById(id: string, context: RepositoryContext, options: FindOptions = {}): Promise<T | null> {
    try {
      this.validateContext(context);
      
      const result = await this.model.findFirst({
        where: this.withTenant({ id }, context),
        include: options.include,
        select: options.select
      });

      return result;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.modelName}`);
    }
  }

  // Find by ID or throw
  async findByIdOrThrow(id: string, context: RepositoryContext, options: FindOptions = {}): Promise<T> {
    const result = await this.findById(id, context, options);
    
    if (!result) {
      throw new NotFoundError(this.modelName, id);
    }

    return result;
  }

  // Find unique by field
  async findUnique(
    field: string,
    value: unknown,
    context: RepositoryContext,
    options: FindOptions = {}
  ): Promise<T | null> {
    try {
      this.validateContext(context);
      
      return await this.model.findFirst({
        where: this.withTenant({ [field]: value }, context),
        include: options.include,
        select: options.select
      });
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.modelName}`);
    }
  }

  // Create with tenant
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, context: RepositoryContext): Promise<T> {
    try {
      this.validateContext(context);
      
      return await this.model.create({
        data: {
          ...data,
          tenantId: context.tenantId
        } as any
      });
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.modelName}`);
    }
  }

  // Update with tenant check
  async update(
    id: string,
    data: Partial<T>,
    context: RepositoryContext
  ): Promise<T> {
    try {
      this.validateContext(context);

      // Verify record exists and belongs to tenant
      const existing = await this.findById(id, context);
      if (!existing) {
        throw new NotFoundError(this.modelName, id);
      }

      return await this.model.update({
        where: { id },
        data: data as any
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update ${this.modelName}`);
    }
  }

  // Delete with tenant check
  async delete(id: string, context: RepositoryContext): Promise<void> {
    try {
      this.validateContext(context);

      // Verify record exists and belongs to tenant
      const existing = await this.findById(id, context);
      if (!existing) {
        throw new NotFoundError(this.modelName, id);
      }

      await this.model.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete ${this.modelName}`);
    }
  }

  // Soft delete (if model has deletedAt field)
  async softDelete(id: string, context: RepositoryContext): Promise<T> {
    try {
      this.validateContext(context);

      const existing = await this.findById(id, context);
      if (!existing) {
        throw new NotFoundError(this.modelName, id);
      }

      return await this.model.update({
        where: { id },
        data: { deletedAt: new Date() } as any
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to soft delete ${this.modelName}`);
    }
  }

  // Transaction wrapper
  async transaction<R>(fn: (tx: PrismaClient) => Promise<R>): Promise<R> {
    return await this.prisma.$transaction(async (tx) => {
      return await fn(tx as PrismaClient);
    });
  }
}
