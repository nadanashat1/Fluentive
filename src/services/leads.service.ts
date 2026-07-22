// Simple Leads Service - Stripe-style modular service
import { prisma } from '@/lib/prisma';
import { RedisCache } from '@/lib/cache/redis-client';
import { logger } from '@/lib/observability/logger';
import { LeadStatus as PrismaLeadStatus } from '@prisma/client';
import { Roles, RoleType } from '@/constants/roles';

export interface LeadFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateLeadData {
  name: string;
  email: string;
  phone?: string;
  status?: PrismaLeadStatus;
}

export class LeadsService {
  // Simple cache helper
  private static cacheKey(tenantId: string, operation: string, params: any = {}) {
    return `leads:${tenantId}:${operation}:${JSON.stringify(params)}`;
  }

  // Get leads - simple, direct, cacheable
  static async getLeads(
    tenantId: string,
    userId: string,
    role: string,
    filters: LeadFilters = {}
  ) {
    const cacheKey = this.cacheKey(tenantId, 'list', filters);
    
    try {
      // Try cache first
      const cached = await RedisCache.get(cacheKey);
      if (cached) {
        logger.info('leads-service', 'Cache hit', { tenantId, operation: 'getLeads' });
        return cached;
      }

      const { page = 1, limit = 20, search, status } = filters;
      const skip = (page - 1) * limit;
      
      const where: any = { isDeleted: false };
      
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
      
      const result = {
        leads,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      };

      // Cache for 5 minutes
      await RedisCache.set(cacheKey, result, 300);
      
      logger.info('leads-service', 'Leads retrieved', { 
        tenantId, 
        count: leads.length,
        total,
        cached: false 
      });

      return result;
    } catch (error) {
      logger.error('leads-service', 'Failed to get leads', error as Error, { tenantId });
      throw error;
    }
  }

  // Create lead - simple, direct, invalidates cache
  static async createLead(
    tenantId: string,
    userId: string,
    data: CreateLeadData
  ) {
    try {
      const lead = await prisma.lead.create({
        data: {
          ...data,
          phone: data.phone || '',
          userId,
          isDeleted: false
        },
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

      // Invalidate list cache
      await RedisCache.del(this.cacheKey(tenantId, 'list', {}));
      
      logger.info('leads-service', 'Lead created', { 
        tenantId, 
        leadId: lead.id,
        name: lead.name 
      });

      return lead;
    } catch (error) {
      logger.error('leads-service', 'Failed to create lead', error as Error, { tenantId });
      throw error;
    }
  }

  // Update lead - simple, direct, invalidates cache
  static async updateLead(
    tenantId: string,
    userId: string,
    leadId: string,
    data: Partial<CreateLeadData>
  ) {
    try {
      const lead = await prisma.lead.update({
        where: { id: leadId, userId },
        data,
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

      // Invalidate relevant caches
      await RedisCache.del(this.cacheKey(tenantId, 'list', {}));
      await RedisCache.del(this.cacheKey(tenantId, 'get', { id: leadId }));
      
      logger.info('leads-service', 'Lead updated', { 
        tenantId, 
        leadId: lead.id,
        changes: Object.keys(data) 
      });

      return lead;
    } catch (error) {
      logger.error('leads-service', 'Failed to update lead', error as Error, { tenantId, leadId });
      throw error;
    }
  }

  // Delete lead - simple, direct, invalidates cache
  static async deleteLead(
    tenantId: string,
    userId: string,
    leadId: string
  ) {
    try {
      await prisma.lead.update({
        where: { id: leadId, userId },
        data: { isDeleted: true, deletedAt: new Date() }
      });

      // Invalidate relevant caches
      await RedisCache.del(this.cacheKey(tenantId, 'list', {}));
      await RedisCache.del(this.cacheKey(tenantId, 'get', { id: leadId }));
      
      logger.info('leads-service', 'Lead deleted', { tenantId, leadId });

      return { deleted: true };
    } catch (error) {
      logger.error('leads-service', 'Failed to delete lead', error as Error, { tenantId, leadId });
      throw error;
    }
  }

  // Get lead by ID - simple, direct, cacheable
  static async getLeadById(
    tenantId: string,
    userId: string,
    leadId: string,
    role: string
  ) {
    const cacheKey = this.cacheKey(tenantId, 'get', { id: leadId });
    
    try {
      // Try cache first
      const cached = await RedisCache.get(cacheKey);
      if (cached) {
        logger.info('leads-service', 'Cache hit', { tenantId, operation: 'getLeadById' });
        return cached;
      }

      const where: any = { id: leadId, isDeleted: false };
      
      if (role !== Roles.ADMIN) {
        where.userId = userId;
      }
      
      const lead = await prisma.lead.findFirst({
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

      if (lead) {
        // Cache for 10 minutes
        await RedisCache.set(cacheKey, lead, 600);
      }

      logger.info('leads-service', 'Lead retrieved', { 
        tenantId, 
        leadId,
        found: !!lead,
        cached: false 
      });

      return lead;
    } catch (error) {
      logger.error('leads-service', 'Failed to get lead', error as Error, { tenantId, leadId });
      throw error;
    }
  }

  // Search leads - simple, direct, cacheable
  static async searchLeads(
    tenantId: string,
    userId: string,
    role: string,
    query: string,
    limit = 20
  ) {
    const cacheKey = this.cacheKey(tenantId, 'search', { query, limit });
    
    try {
      // Try cache first
      const cached = await RedisCache.get(cacheKey);
      if (cached) {
        logger.info('leads-service', 'Cache hit', { tenantId, operation: 'searchLeads' });
        return cached;
      }

      const whereClause: any = {
        isDeleted: false,
        ...(role !== Roles.ADMIN ? { userId } : {}),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      };

      const results = await prisma.lead.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 50),
      });

      // Cache for 30 minutes
      await RedisCache.set(cacheKey, results, 1800);

      logger.info('leads-service', 'Leads searched', { 
        tenantId, 
        query,
        count: results.length,
        cached: false 
      });

      return results;
    } catch (error) {
      logger.error('leads-service', 'Failed to search leads', error as Error, { tenantId, query });
      throw error;
    }
  }

  // Get lead statistics - simple, direct, cacheable
  static async getLeadStats(
    tenantId: string,
    userId: string,
    role: string
  ) {
    const cacheKey = this.cacheKey(tenantId, 'stats');
    
    try {
      // Try cache first
      const cached = await RedisCache.get(cacheKey);
      if (cached) {
        logger.info('leads-service', 'Cache hit', { tenantId, operation: 'getLeadStats' });
        return cached;
      }

      const whereClause = {
        isDeleted: false,
        ...(role !== Roles.ADMIN ? { userId } : {}),
      };

      const [total, byStatus, recent] = await Promise.all([
        prisma.lead.count({ where: whereClause }),
        prisma.lead.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true,
        }),
        prisma.lead.count({
          where: {
            ...whereClause,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const result = {
        total,
        byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        recent30Days: recent,
      };

      // Cache for 10 minutes
      await RedisCache.set(cacheKey, result, 600);

      logger.info('leads-service', 'Lead stats retrieved', { 
        tenantId, 
        total,
        cached: false 
      });

      return result;
    } catch (error) {
      logger.error('leads-service', 'Failed to get lead stats', error as Error, { tenantId });
      throw error;
    }
  }
}
