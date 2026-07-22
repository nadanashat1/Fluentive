// Database service layer abstraction for leads
import { prisma } from '@/lib/prisma';

import { getOrSetCache, CacheKeys, cache } from '@/lib/cache/redis-cache';
import { Roles, RoleType } from '@/constants/roles';

export interface LeadFilters {
  search?: string;
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export class LeadsService {
  // Get leads with caching
  static async getLeads(userId: string, role: string, filters: LeadFilters = {}) {
    const cacheKey = CacheKeys.LEADS_LIST(userId);
    
    return getOrSetCache(cacheKey, async () => {
      const { page = 1, limit = 20, search, status } = filters;
      const skip = (page - 1) * limit;
      
      const where: any = { isDeleted: false };
      
      // Apply filters
      if (role !== Roles.ADMIN) {
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
    }, 300); // 5 minute cache
  }

  // Create lead with cache invalidation
  static async createLead(data: any, userId: string) {
    const lead = await prisma.lead.create({
      data: {
        ...data,
        userId,
        isDeleted: false
      }
    });
    
    // Invalidate user's leads cache
    await cache.del(CacheKeys.LEADS_LIST(userId));
    
    return lead;
  }

  // Update lead with cache invalidation
  static async updateLead(id: string, data: any, userId: string) {
    const lead = await prisma.lead.update({
      where: { id, userId },
      data
    });
    
    // Invalidate user's leads cache
    await cache.del(CacheKeys.LEADS_LIST(userId));
    
    return lead;
  }

  // Delete lead (soft delete) with cache invalidation
  static async deleteLead(id: string, userId: string) {
    await prisma.lead.update({
      where: { id, userId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    
    // Invalidate user's leads cache
    await cache.del(CacheKeys.LEADS_LIST(userId));
  }

  // Get lead by ID with caching
  static async getLeadById(id: string, userId: string, role: string) {
    const cacheKey = `lead:${id}:${userId}`;
    
    return getOrSetCache(cacheKey, async () => {
      const where: any = { id, isDeleted: false };
      
      if (role !== Roles.ADMIN) {
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
          createdAt: true,
          updatedAt: true,
        }
      });
    }, 600); // 10 minute cache
  }
}
