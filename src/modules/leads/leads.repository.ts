// Leads Repository
// Database access layer with tenant isolation

import { Prisma } from '@prisma/client';

// Use any types temporarily until Prisma client is properly generated
type Lead = any;
type LeadWhereInput = any;
import { BaseRepository, RepositoryContext, FindOptions } from '@/core/base/repository';

export interface LeadWithRelations extends Lead {
  notes?: any[];
  attachments?: any[];
  assignedUser?: any;
}

export class LeadsRepository extends BaseRepository<Lead> {
  constructor() {
    super('lead');
  }

  // Find leads with pagination and filtering
  async findLeads(
    context: RepositoryContext,
    options: {
      status?: string;
      source?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const where: LeadWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.source) {
      where.source = options.source;
    }

    if (options.assignedTo) {
      // Current schema uses ownerId/owner rather than assignedTo
      where.ownerId = options.assignedTo;
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search, mode: 'insensitive' } }
      ];
    }

    const total = await this.count(context, where);
    
    const leads = await this.findAll(context, {
      where,
      include: {
        notes: {
          where: { isImportant: true },
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { notes: true, attachments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: options.page ? (options.page - 1) * (options.limit || 20) : 0,
      take: options.limit || 20
    });

    return {
      data: leads,
      meta: {
        total,
        page: options.page || 1,
        limit: options.limit || 20,
        totalPages: Math.ceil(total / (options.limit || 20)),
        hasMore: (options.page || 1) * (options.limit || 20) < total
      }
    };
  }

  // Get single lead with full details
  async getLeadDetails(id: string, context: RepositoryContext): Promise<LeadWithRelations | null> {
    return await this.findById(id, context, {
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true, id: true } } }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  // Create lead with validation
  async createLead(
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>,
    context: RepositoryContext
  ): Promise<Lead> {
    // Check for duplicate email within tenant
    if (data.email) {
      const existing = await this.findUnique('email', data.email, context);
      if (existing) {
        throw new Error(`Lead with email ${data.email} already exists`);
      }
    }

    return await this.create(data, context);
  }

  // Update lead status
  async updateStatus(
    id: string,
    status: string,
    context: RepositoryContext
  ): Promise<Lead> {
    const lead = await this.findByIdOrThrow(id, context);
    
    // Get previous status for activity logging
    const previousStatus = (lead as Lead).status;

    const updated = await this.update(id, { status }, context);

    // Return with metadata for activity logging
    return Object.assign(updated, { _previousStatus: previousStatus });
  }

  // Get lead statistics for dashboard
  async getStats(context: RepositoryContext) {
    const baseWhere = this.withTenant({}, context);

    const [
      total,
      byStatus,
      bySource,
      recent
    ] = await Promise.all([
      this.model.count({ where: baseWhere }),
      
      this.model.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true }
      }),
      
      this.model.groupBy({
        by: ['source'],
        where: baseWhere,
        _count: { source: true }
      }),
      
      this.model.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, status: true, createdAt: true }
      })
    ]);

    return {
      total,
      byStatus,
      bySource,
      recent
    };
  }
}

// Export singleton instance
export const leadsRepository = new LeadsRepository();
