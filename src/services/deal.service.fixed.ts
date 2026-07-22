import { PrismaClient } from '@prisma/client';
import { DEAL_STAGES, type DealStage } from '@/lib/constants/deal-stages';

const prisma = new PrismaClient();

export interface CreateDealDTO {
  title: string;
  value?: number;
  leadId: string;
}

export interface UpdateDealDTO {
  title?: string;
  value?: number;
  stage?: string;
}

export interface PaginatedDealsQuery {
  page: number;
  limit: number;
  search?: string;
  stage?: string;
}

export class DealService {
  async createDeal(userId: string, data: CreateDealDTO, idempotencyKey?: string) {
    // Request-level idempotency
    if (idempotencyKey) {
      const existing = await prisma.deal.findFirst({
        where: { 
          userId,
          leadId: data.leadId,
          isDeleted: false
        }
      });
      if (existing) {
        return existing;
      }
    }

    return prisma.deal.create({
      data: {
        title: data.title,
        value: data.value,
        userId,
        leadId: data.leadId,
        stage: 'OPEN',
      },
    });
  }

  async getDeals(userId: string, query: PaginatedDealsQuery) {
    const { page, limit, search, stage } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isDeleted: false,
    };

    if (stage) {
      where.stage = stage;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { lead: { 
          name: { contains: search, mode: 'insensitive' }
        } },
      ];
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          value: true,
          stage: true,
          createdAt: true,
          updatedAt: true,
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDealById(userId: string, dealId: string) {
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        userId,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!deal) {
      throw new Error('DEAL_NOT_FOUND');
    }

    return deal;
  }

  async updateDeal(userId: string, dealId: string, data: UpdateDealDTO) {
    // Ownership validation
    const existingDeal = await this.getDealById(userId, dealId);

    // Business rule: Log stage changes
    if (data.stage && data.stage !== existingDeal.stage) {
      await prisma.activity.create({
        data: {
          type: 'DEAL_STAGE_CHANGED',
          userId,
          dealId,
          description: `Deal stage changed from ${existingDeal.stage} to ${data.stage}`,
        },
      });
    }

    const { stage, ...rest } = data;
    return prisma.deal.update({
      where: { id: dealId },
      data: {
        ...rest,
        ...(stage !== undefined ? { stage: stage as any } : {}),
        updatedAt: new Date(),
      },
    });
  }

  async deleteDeal(userId: string, dealId: string) {
    // Soft delete with ownership validation
    const deal = await this.getDealById(userId, dealId);

    return prisma.deal.update({
      where: { id: dealId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async winDeal(userId: string, dealId: string) {
    return prisma.$transaction(async (tx: any) => {
      const deal = await tx.deal.findFirst({
        where: { id: dealId, userId, isDeleted: false },
      });

      if (!deal) {
        throw new Error('DEAL_NOT_FOUND');
      }

      if (deal.stage === DEAL_STAGES[1]) { // WON
        throw new Error('DEAL_ALREADY_WON');
      }

      if (deal.stage === DEAL_STAGES[2]) { // LOST
        throw new Error('CANNOT_WIN_LOST_DEAL');
      }

      // Update deal stage
      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: { stage: DEAL_STAGES[1] }, // WON
      });

      // Log activity
      await tx.activity.create({
        data: {
          type: 'DEAL_WON',
          userId,
          dealId,
          description: `Deal "${deal.title}" won with value $${deal.value || 0}`,
        },
      });

      return updatedDeal;
    });
  }

  async loseDeal(userId: string, dealId: string, reason?: string) {
    return prisma.$transaction(async (tx: any) => {
      const deal = await tx.deal.findFirst({
        where: { id: dealId, userId, isDeleted: false },
      });

      if (!deal) {
        throw new Error('DEAL_NOT_FOUND');
      }

      if (deal.stage === DEAL_STAGES[2]) { // LOST
        throw new Error('DEAL_ALREADY_LOST');
      }

      if (deal.stage === DEAL_STAGES[1]) { // WON
        throw new Error('CANNOT_LOSE_WON_DEAL');
      }

      // Update deal stage
      const updatedDeal = await tx.deal.update({
        where: { id: dealId },
        data: { stage: DEAL_STAGES[2] }, // LOST
      });

      // Log activity
      await tx.activity.create({
        data: {
          type: 'DEAL_LOST',
          userId,
          dealId,
          description: `Deal "${deal.title}" lost${reason ? `: ${reason}` : ''}`,
        },
      });

      return updatedDeal;
    });
  }

  async getDealStats(userId: string) {
    const [
      totalDeals,
      wonDeals,
      lostDeals,
      openDeals,
      totalValue,
    ] = await Promise.all([
      prisma.deal.count({
        where: { userId, isDeleted: false },
      }),
      prisma.deal.count({
        where: { userId, isDeleted: false, stage: 'WON' },
      }),
      prisma.deal.count({
        where: { userId, isDeleted: false, stage: 'LOST' },
      }),
      prisma.deal.count({
        where: { userId, isDeleted: false, stage: 'OPEN' },
      }),
      prisma.deal.aggregate({
        where: { 
          userId, 
          isDeleted: false, 
          stage: 'WON',
          value: { not: null }
        },
        _sum: { value: true },
      }),
    ]);

    const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    const averageDealValue = wonDeals > 0 ? (totalValue._sum.value || 0) / wonDeals : 0;

    return {
      totalDeals,
      wonDeals,
      lostDeals,
      openDeals,
      winRate: Math.round(winRate * 100) / 100,
      totalRevenue: totalValue._sum.value || 0,
      averageDealValue: Math.round(averageDealValue * 100) / 100,
    };
  }

  // Authorization helper
  private assertOwnership(resourceUserId: string, currentUserId: string) {
    if (resourceUserId !== currentUserId) {
      throw new Error('FORBIDDEN');
    }
  }
}
