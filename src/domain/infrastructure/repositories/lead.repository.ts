import type { LeadStatus } from '@prisma/client';
import { Prisma, PrismaClient } from '@prisma/client';
import { DomainLead, LeadRepository } from '../../execute';

// Lead Repository - Domain owns Prisma access
export class PrismaLeadRepository implements LeadRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<DomainLead | null> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId,
        isDeleted: false
      }
    });

    if (!lead) return null;

    return this.mapToDomainLead(lead as any);
  }

  async findByEmail(email: string, organizationId: string): Promise<DomainLead | null> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId,
        isDeleted: false
      }
    });

    if (!lead) return null;

    return this.mapToDomainLead(lead as any);
  }

  async create(lead: DomainLead): Promise<DomainLead> {
    const created = await this.prisma.lead.create({
      data: {
        id: lead.id,
        organizationId: lead.workspaceId,
        name: lead.name,
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        status: lead.status as LeadStatus,
        userId: lead.ownerId,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      }
    });

    return this.mapToDomainLead(created as any);
  }

  async update(id: string, updates: Partial<DomainLead>): Promise<DomainLead> {
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email.toLowerCase() }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.status && { status: updates.status }),
        ...(updates.ownerId && { userId: updates.ownerId }),
        updatedAt: new Date()
      }
    });

    return this.mapToDomainLead(updated as any);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.lead.update({
      where: { id, organizationId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async findMany(organizationId: string, filters: {
    ownerId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<DomainLead[]> {
    const { ownerId, status, search, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      organizationId,
      isDeleted: false
    };

    if (ownerId) where.userId = ownerId;
    if (status) where.status = status as LeadStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const leads = await this.prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return leads.map((lead) => this.mapToDomainLead(lead as any));
  }

  private mapToDomainLead(lead: {
    id: string;
    organizationId: string | null;
    userId: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    status: LeadStatus;
    createdAt: Date;
    updatedAt: Date;
  }): DomainLead {
    return {
      id: lead.id,
      workspaceId: lead.organizationId ?? '',
      ownerId: lead.userId ?? '',
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    };
  }
}
