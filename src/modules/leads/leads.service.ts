// Leads Service
// Business logic layer with event publishing

// Use any type temporarily until Prisma client is properly generated
type Lead = any;
import { LeadsRepository, leadsRepository } from './leads.repository';
import { BaseService, ServiceContext, QueryOptions, PaginatedResult } from '@/core/base/service';
import { AppError, NotFoundError, ValidationError } from '@/core/base/error';
import { Events, eventBus } from '@/services/event-bus';

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: string;
  notes?: string;
  assignedTo?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {}

export class LeadsService extends BaseService<Lead> {
  private repository: LeadsRepository;

  constructor() {
    super('lead');
    this.repository = leadsRepository;
  }

  // Find all leads with filtering
  async findAll(
    options: QueryOptions,
    context: ServiceContext
  ): Promise<PaginatedResult<Lead>> {
    this.validateContext(context);

    const result = await this.repository.findLeads(context, {
      status: options.filters?.status as string,
      source: options.filters?.source as string,
      assignedTo: options.filters?.assignedTo as string,
      search: options.filters?.search as string,
      page: options.page,
      limit: options.limit
    });

    return {
      data: result.data,
      meta: result.meta
    };
  }

  // Get single lead
  async findById(id: string, context: ServiceContext): Promise<Lead | null> {
    this.validateContext(context);
    return await this.repository.getLeadDetails(id, context);
  }

  // Create new lead
  async create(data: CreateLeadInput, context: ServiceContext): Promise<Lead> {
    this.validateContext(context);

    // Validate required fields
    if (!data.name?.trim()) {
      throw new ValidationError('Lead name is required');
    }

    // Create lead
    const lead = await this.repository.createLead({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      source: data.source || 'manual',
      status: data.status || 'new',
      assignedTo: data.assignedTo
    } as any, context);

    // Publish event
    await this.publishEvent(Events.LEAD_CREATED, {
      leadId: (lead as any).id,
      name: lead.name,
      email: lead.email,
      source: data.source
    }, context);

    // Log activity
    await this.logActivity('lead_created', lead, context);

    return lead;
  }

  // Update lead
  async update(id: string, data: UpdateLeadInput, context: ServiceContext): Promise<Lead> {
    this.validateContext(context);

    // Check lead exists
    const existing = await this.findById(id, context);
    if (!existing) {
      throw new NotFoundError('Lead', id);
    }

    // If status is changing, validate transition
    if (data.status && data.status !== (existing as any).status) {
      this.validateStatusTransition((existing as any).status, data.status);
    }

    // Update lead
    const updated = await this.repository.update(id, data as any, context);

    // Publish event
    await this.publishEvent(Events.LEAD_UPDATED, {
      leadId: (updated as any).id,
      changes: data,
      previousStatus: (existing as any).status
    }, context);

    // Log activity
    await this.logActivity('lead_updated', updated, context, { changes: Object.keys(data) });

    return updated;
  }

  // Delete lead
  async delete(id: string, context: ServiceContext): Promise<void> {
    this.validateContext(context);

    // Check lead exists
    const existing = await this.findById(id, context);
    if (!existing) {
      throw new NotFoundError('Lead', id);
    }

    // Soft delete (keeps history)
    await this.repository.softDelete(id, context);

    // Publish event
    await this.publishEvent(Events.LEAD_DELETED, {
      leadId: id,
      name: existing.name
    }, context);

    // Log activity
    await this.logActivity('lead_deleted', existing, context);
  }

  // Assign lead to user
  async assign(id: string, userId: string, context: ServiceContext): Promise<Lead> {
    this.validateContext(context);

    const lead = await this.findById(id, context);
    if (!lead) {
      throw new NotFoundError('Lead', id);
    }

    const updated = await this.update(id, { assignedTo: userId }, context);

    await this.publishEvent(Events.LEAD_ASSIGNED, {
      leadId: id,
      assignedTo: userId,
      assignedBy: context.userId
    }, context);

    return updated;
  }

  // Convert lead to deal
  async convertToDeal(id: string, dealData: any, context: ServiceContext): Promise<any> {
    this.validateContext(context);

    const lead = await this.findById(id, context);
    if (!lead) {
      throw new NotFoundError('Lead', id);
    }

    if ((lead as any).status === 'converted') {
      throw new ValidationError('Lead is already converted');
    }

    // Update lead status
    await this.update(id, { status: 'converted' }, context);

    // Create deal (would call DealService in real implementation)
    const deal = {
      leadId: id,
      name: dealData.name || lead.name,
      value: dealData.value,
      ...dealData
    };

    await this.publishEvent(Events.LEAD_CONVERTED, {
      leadId: id,
      dealId: 'temp-deal-id', // Would be actual deal ID
      value: dealData.value
    }, context);

    return deal;
  }

  // Get dashboard stats
  async getStats(context: ServiceContext) {
    this.validateContext(context);
    return await this.repository.getStats(context);
  }

  // Export leads to CSV
  async exportToCSV(context: ServiceContext): Promise<string> {
    this.validateContext(context);

    const allLeads = await this.repository.findAll(context, {
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Created'];
    const rows = allLeads.map((lead: any) => [
      lead.id,
      lead.name,
      lead.email || '',
      lead.phone || '',
      lead.company || '',
      lead.source || '',
      lead.status || '',
      lead.createdAt
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  // Private helpers

  private validateStatusTransition(from: string, to: string): void {
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      throw new ValidationError(`Invalid status transition: from=${from}, to=${to}`);
    }

    const validTransitions: Record<string, string[]> = {
      'new': ['contacted', 'qualified', 'lost'],
      'contacted': ['qualified', 'proposal', 'lost'],
      'qualified': ['proposal', 'negotiation', 'converted', 'lost'],
      'proposal': ['negotiation', 'converted', 'lost'],
      'negotiation': ['converted', 'lost'],
      'converted': [], // Final state
      'lost': ['new'] // Can reopen
    };

    const allowed = validTransitions[from] || [];
    if (!allowed.includes(to)) {
      throw new ValidationError(`Cannot transition from '${from}' to '${to}'`);
    }
  }

  private async logActivity(
    action: string,
    lead: Lead,
    context: ServiceContext,
    meta?: any
  ): Promise<void> {
    await eventBus.publish({
      type: Events.ACTIVITY_LOGGED,
      payload: {
        action,
        entityType: 'lead',
        entityId: (lead as any).id,
        entityName: lead.name,
        userId: context.userId,
        tenantId: context.tenantId,
        timestamp: new Date().toISOString(),
        ...meta
      },
      timestamp: new Date(),
      service: 'LeadsService',
      tenantId: context.tenantId,
      userId: context.userId
    });
  }
}

// Export singleton
export const leadsService = new LeadsService();
