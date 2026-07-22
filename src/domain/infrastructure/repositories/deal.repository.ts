import type { DealStage } from '@prisma/client';
import { Prisma, PrismaClient } from '@prisma/client';
import { DomainDeal, DealRepository } from '../../execute';

export class PrismaDealRepository implements DealRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<DomainDeal | null> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        organizationId,
        isDeleted: false
      }
    });

    if (!deal) return null;

    return this.mapToDomainDeal(deal as any);
  }

  async findByLeadId(leadId: string, organizationId: string): Promise<DomainDeal[]> {
    const deals = await this.prisma.deal.findMany({
      where: {
        leadId,
        organizationId,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' }
    });

    return deals.map((d) => this.mapToDomainDeal(d as any));
  }

  async create(deal: DomainDeal): Promise<DomainDeal> {
    const created = await this.prisma.deal.create({
      data: {
        id: deal.id,
        organizationId: deal.workspaceId,
        userId: deal.ownerId,
        leadId: deal.leadId,
        title: deal.title,
        value: deal.value,
        stage: deal.stage as DealStage,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt
      }
    });

    return this.mapToDomainDeal(created as any);
  }

  async update(id: string, updates: Partial<DomainDeal>): Promise<DomainDeal> {
    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.value !== undefined && { value: updates.value }),
        ...(updates.stage && { stage: updates.stage }),
        ...(updates.ownerId && { userId: updates.ownerId }),
        updatedAt: new Date()
      }
    });

    return this.mapToDomainDeal(updated as any);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.deal.update({
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
    stage?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<DomainDeal[]> {
    const { ownerId, stage, search, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.DealWhereInput = {
      organizationId,
      isDeleted: false
    };

    if (ownerId) where.userId = ownerId;
    if (stage) where.stage = stage as DealStage;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        {
          lead: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    const deals = await this.prisma.deal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return deals.map((d) => this.mapToDomainDeal(d as any));
  }

  private mapToDomainDeal(deal: {
    id: string;
    organizationId: string | null;
    userId: string | null;
    leadId: string | null;
    title: string;
    value: number | null;
    stage: DealStage;
    createdAt: Date;
    updatedAt: Date;
  }): DomainDeal {
    return {
      id: deal.id,
      workspaceId: deal.organizationId ?? '',
      ownerId: deal.userId ?? '',
      leadId: deal.leadId ?? '',
      title: deal.title,
      value: deal.value ?? 0,
      stage: deal.stage,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt
    };
  }
}
