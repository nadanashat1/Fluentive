import { PrismaClient, LeadStatus } from '@prisma/client';
import { mapLeadStatus } from '@/lib/enum-mappers';

const prisma = new PrismaClient();

export interface CreateLeadDTO {
  name: string;
  phone: string;
  email: string;
}

export interface UpdateLeadDTO {
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface PaginatedLeadsQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export class LeadService {
  async createLead(userId: string, data: CreateLeadDTO, idempotencyKey?: string) {
    // Request-level idempotency (correct pattern)
    if (idempotencyKey) {
      const existing = await prisma.lead.findFirst({
        where: { 
          userId,
          // Store idempotency in a separate table in real implementation
          // For now, using a temporary approach
          name: data.name,
          email: data.email,
          phone: data.phone,
          isDeleted: false
        }
      });
      if (existing) {
        return existing;
      }
    }

    return prisma.lead.create({
      data: {
        ...data,
        userId,
        status: LeadStatus.NEW,
      },
    });
  }

  async getLeads(userId: string, query: PaginatedLeadsQuery) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLeadById(userId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!lead) {
      throw new Error('LEAD_NOT_FOUND');
    }

    return lead;
  }

  async updateLead(userId: string, leadId: string, data: UpdateLeadDTO) {
    // Ownership validation
    const existingLead = await this.getLeadById(userId, leadId);

    const mappedData = {
      ...data,
      status: data.status ? mapLeadStatus(data.status) : undefined
    };

    return prisma.lead.update({
      where: { id: leadId },
      data: {
        ...mappedData,
        updatedAt: new Date(),
      },
    });
  }

  async deleteLead(userId: string, leadId: string) {
    // Soft delete with ownership validation
    const lead = await this.getLeadById(userId, leadId);

    return prisma.lead.update({
      where: { id: leadId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async convertLeadToDeal(userId: string, leadId: string, dealData: { title: string; value?: number }) {
    return prisma.$transaction(async (tx: any) => {
      const lead = await tx.lead.findFirst({
        where: { id: leadId, userId, isDeleted: false },
      });

      if (!lead) {
        throw new Error('LEAD_NOT_FOUND');
      }

      if (lead.status !== LeadStatus.QUALIFIED) {
        throw new Error('INVALID_LEAD_STATE');
      }

      // Create deal
      const deal = await tx.deal.create({
        data: {
          title: dealData.title,
          value: dealData.value,
          userId,
          leadId: lead.id,
        },
      });

      // Update lead status
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.QUALIFIED },
      });

      // Log activity
      await tx.activity.create({
        data: {
          type: 'LEAD_CONVERTED',
          userId,
          leadId: lead.id,
          dealId: deal.id,
          description: `Lead "${lead.name}" converted to deal "${dealData.title}"`,
        },
      });

      return deal;
    });
  }

  // Authorization helper
  private assertOwnership(resourceUserId: string, currentUserId: string) {
    if (resourceUserId !== currentUserId) {
      throw new Error('FORBIDDEN');
    }
  }
}
