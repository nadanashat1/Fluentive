// Repository Layer - Pure Prisma access ONLY
import { prisma } from '@/lib/prisma';
import { LeadStatus, DealStage } from '@prisma/client';
import { mapLeadStatus, mapDealStage } from '@/lib/enum-mappers';
import { unsafeEnum } from '@/lib/ts-safe';

export interface LeadFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  userId: string;
}

export interface UpdateLeadData {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export class LeadRepository {
  // Pure database operations - NO business logic
  static async create(data: CreateLeadData) {
    const mappedData = {
      ...data,
      status: unsafeEnum(mapLeadStatus(data.status)),
    };
    
    return prisma.lead.create({
      data: {
        ...mappedData,
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  static async findById(id: string, userId?: string) {
    const where: any = { id, isDeleted: false };
    if (userId) {
      where.userId = userId;
    }
    
    return prisma.lead.findFirst({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  static async findMany(filters: LeadFilters, userId?: string, isAdmin = false) {
    const { page = 1, limit = 20, search, status } = filters;
    const skip = (page - 1) * limit;
    
    const where: any = { isDeleted: false };
    
    if (!isAdmin && userId) {
      where.userId = userId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.lead.count({ where })
    ]);
    
    return {
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };
  }

  static async update(id: string, data: UpdateLeadData, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }
    
    const mappedData = {
      ...data,
      status: data.status ? unsafeEnum(mapLeadStatus(data.status)) : undefined,
    };
    
    return prisma.lead.update({
      where,
      data: mappedData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  static async softDelete(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }
    
    return prisma.lead.update({
      where,
      data: { isDeleted: true, deletedAt: new Date() }
    });
  }

  static async count(filters: LeadFilters, userId?: string, isAdmin = false) {
    const where: any = { isDeleted: false };
    
    if (!isAdmin && userId) {
      where.userId = userId;
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    return prisma.lead.count({ where });
  }

  static async getStats(filters: LeadFilters, userId?: string, isAdmin = false) {
    const where: any = { isDeleted: false };
    
    if (!isAdmin && userId) {
      where.userId = userId;
    }
    
    const [total, byStatus, recent] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.lead.count({
        where: {
          ...where,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      recent30Days: recent,
    };
  }

  static async search(query: string, limit = 20, userId?: string, isAdmin = false) {
    const where: any = {
      isDeleted: false,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ],
    };
    
    if (!isAdmin && userId) {
      where.userId = userId;
    }
    
    return prisma.lead.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
    });
  }
}
