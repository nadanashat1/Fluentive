import { PrismaClient, DealStage } from '@prisma/client';
import { mapDealStage, DEAL_STAGES } from '@/lib/enum-mappers';

// Use any types temporarily until Prisma client is properly generated
type Deal = any;

const prisma = new PrismaClient();

export interface CreateDealDTO {
  title: string;
  value?: number;
  leadId: string;
}

export interface UpdateDealDTO {
  title?: string;
  value?: number;
  stage?: DealStage;
}

export interface PaginatedDealsQuery {
  page: number;
  limit: number;
  search?: string;
  stage?: DealStage;
}

export class DealService {
  // Create deal
  async createDeal(userId: string, data: CreateDealDTO) {
    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        value: data.value,
        userId,
        leadId: data.leadId,
        stage: DealStage.OPEN,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    return deal;
  }

  // Get deals
  async getDeals(userId: string, query: PaginatedDealsQuery) {
    const { page, limit, search, stage } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isDeleted: false,
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(stage && { stage })
    };

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
      prisma.deal.count({ where })
    ]);

    return {
      deals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };
  }

  // Get deal by ID
  async getDealById(userId: string, dealId: string) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, userId, isDeleted: false }
    });

    if (!deal) {
      throw new Error('DEAL_NOT_FOUND');
    }

    return deal;
  }

  // Update deal
  async updateDeal(userId: string, dealId: string, data: UpdateDealDTO) {
    const existingDeal = await this.getDealById(userId, dealId);

    if (!existingDeal) {
      throw new Error('DEAL_NOT_FOUND');
    }

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

    const mappedData = {
      ...data,
      stage: data.stage ? mapDealStage(data.stage) : undefined
    };

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        ...mappedData,
        updatedAt: new Date(),
      },
    });

    return updatedDeal;
  }

  // Win deal
  async winDeal(userId: string, dealId: string) {
    const deal = await this.getDealById(userId, dealId);

    if (!deal) {
      throw new Error('DEAL_NOT_FOUND');
    }

    if (deal.stage === DealStage.WON) {
      throw new Error('DEAL_ALREADY_WON');
    }

    if (deal.stage === DealStage.LOST) {
      throw new Error('CANNOT_WIN_LOST_DEAL');
    }

    // Update deal stage
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: { stage: DealStage.WON },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'DEAL_WON',
        dealId: deal.id,
        userId,
        createdAt: new Date()
      }
    });

    return updatedDeal;
  }

  // Lose deal
  async loseDeal(userId: string, dealId: string) {
    const deal = await this.getDealById(userId, dealId);

    if (!deal) {
      throw new Error('DEAL_NOT_FOUND');
    }

    if (deal.stage === DealStage.WON) {
      throw new Error('DEAL_ALREADY_WON');
    }

    if (deal.stage === DealStage.LOST) {
      throw new Error('DEAL_ALREADY_LOST');
    }

    // Update deal stage
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: { stage: DealStage.LOST },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'DEAL_LOST',
        dealId: deal.id,
        userId,
        createdAt: new Date()
      }
    });

    return updatedDeal;
  }

  // Delete deal (soft delete)
  async deleteDeal(userId: string, dealId: string) {
    const deal = await this.getDealById(userId, dealId);

    if (!deal) {
      throw new Error('DEAL_NOT_FOUND');
    }

    // Soft delete with activity log
    return prisma.deal.update({
      where: { id: dealId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // Get deal statistics
  async getDealStats(userId: string) {
    const [totalDeals, wonDeals, lostDeals, openDeals, totalValue] = await Promise.all([
      prisma.deal.count({
        where: { userId, isDeleted: false }
      }),
      prisma.deal.count({
        where: { userId, isDeleted: false, stage: DealStage.WON }
      }),
      prisma.deal.count({
        where: { userId, isDeleted: false, stage: DealStage.LOST }
      }),
      prisma.deal.count({
        where: { userId, isDeleted: false, stage: DealStage.OPEN }
      }),
      prisma.deal.aggregate({
        where: { userId, isDeleted: false, stage: DealStage.WON },
        _sum: { value: true }
      })
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

  // Get deal value by stage
  async getDealValueByStage(userId: string) {
    const [totalValue, wonValue, lostValue, openValue] = await Promise.all([
      prisma.deal.aggregate({
        where: { userId, isDeleted: false },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { userId, isDeleted: false, stage: DealStage.WON },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { userId, isDeleted: false, stage: DealStage.LOST },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { userId, isDeleted: false, stage: DealStage.OPEN },
        _sum: { value: true }
      })
    ]);

    return {
      total: totalValue._sum.value || 0,
      won: wonValue._sum.value || 0,
      lost: lostValue._sum.value || 0,
      open: openValue._sum.value || 0
    };
  }
}
