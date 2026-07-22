import type { ActivityRepository } from '../../execute';
import { ActivityType, type DomainActivity } from '../../shared/types';
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export class PrismaActivityRepository implements ActivityRepository {
  constructor(private prisma: PrismaClient) {}

  async create(activity: DomainActivity): Promise<DomainActivity> {
    const created = await this.prisma.activity.create({
      data: {
        id: activity.id,
        organizationId: activity.workspaceId,
        userId: activity.userId,
        leadId: activity.leadId ?? null,
        dealId: activity.dealId ?? null,
        type: activity.type as any, // Cast due to domain/prisma enum mismatch
        description: activity.description,
        createdAt: activity.createdAt
      }
    });

    return this.mapToDomainActivity(created);
  }

  async findByEntity(aggregateId: string, organizationId: string): Promise<DomainActivity[]> {
    const where: Prisma.ActivityWhereInput = {
      organizationId,
      OR: [{ leadId: aggregateId }, { dealId: aggregateId }, { id: aggregateId }]
    };

    const rows = await this.prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return rows.map((row) => this.mapToDomainActivity(row));
  }

  async findMany(organizationId: string, filters: {
    userId?: string;
    leadId?: string;
    dealId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<DomainActivity[]> {
    const {
      userId,
      leadId,
      dealId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {
      organizationId
    };

    if (userId) where.userId = userId;
    if (leadId) where.leadId = leadId;
    if (dealId) where.dealId = dealId;
    if (type) where.type = type as any;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const activities = await this.prisma.activity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return activities.map((a) => this.mapToDomainActivity(a));
  }

  private mapToDomainActivity(
    activity: {
      id: string;
      organizationId: string | null;
      userId: string | null;
      leadId: string | null;
      dealId: string | null;
      type: string;
      description: string | null;
      createdAt: Date;
    }
  ): DomainActivity {
    return {
      id: activity.id,
      workspaceId: activity.organizationId ?? '',
      userId: activity.userId ?? '',
      leadId: activity.leadId ?? undefined,
      dealId: activity.dealId ?? undefined,
      type: activity.type as ActivityType,
      description: activity.description ?? '',
      createdAt: activity.createdAt
    };
  }
}
