// Enforced Leads Service - ONLY works through SaaS Executor
import { saasExecute, SaaSRoutes } from '@/core/saas-executor';
import { prisma } from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';
import { mapLeadStatus } from '@/lib/enum-mappers';
import { Roles, RoleType } from '@/constants/roles';

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  page?: number;
  limit?: number;
}

export interface CreateLeadData {
  name: string;
  email: string;
  phone?: string;
  status?: LeadStatus;
}

export class EnforcedLeadsService {
  // Get leads - MUST go through SaaS executor
  static async getLeads(
    tenantId: string,
    userId: string,
    role: string,
    filters: LeadFilters = {}
  ) {
    return saasExecute({
      tenantId,
      userId,
      operation: 'leads.list',
      key: `leads.list:${JSON.stringify(filters)}`,
      query: async () => {
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
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
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
      },
      cache: true,
      cacheTTL: 300, // 5 minutes
    });
  }

  // Create lead - MUST go through SaaS executor
  static async createLead(
    tenantId: string,
    userId: string,
    data: CreateLeadData
  ) {
    return saasExecute({
      tenantId,
      userId,
      operation: 'leads.create',
      key: `leads.create:${userId}:${Date.now()}`,
      query: async () => {
        const mappedData = {
          ...data,
          status: mapLeadStatus(data.status)
        };
        
        const lead = await prisma.lead.create({
          data: {
            ...mappedData,
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
        
        return lead;
      },
      cache: false, // Don't cache creation operations
      onSuccess: async (result: any) => {
        // Invalidate leads list cache
        const cacheKey = `${tenantId}:leads.list:*`;
        // This would need Redis pattern matching - simplified for now
      },
    });
  }

  // Update lead - MUST go through SaaS executor
  static async updateLead(
    tenantId: string,
    userId: string,
    leadId: string,
    data: Partial<CreateLeadData>
  ) {
    return saasExecute({
      tenantId,
      userId,
      operation: 'leads.update',
      key: `leads.update:${leadId}`,
      query: async () => {
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
        
        return lead;
      },
      cache: false,
      onSuccess: async (result: any) => {
        // Invalidate relevant caches
        // This would need Redis pattern matching
      },
    });
  }

  // Delete lead - MUST go through SaaS executor
  static async deleteLead(
    tenantId: string,
    userId: string,
    leadId: string
  ) {
    return saasExecute({
      tenantId,
      userId,
      operation: 'leads.delete',
      key: `leads.delete:${leadId}`,
      query: async () => {
        await prisma.lead.update({
          where: { id: leadId, userId },
          data: { isDeleted: true, deletedAt: new Date() }
        });
        
        return { deleted: true };
      },
      cache: false,
      onSuccess: async (result: any) => {
        // Invalidate relevant caches
        // This would need Redis pattern matching
      },
    });
  }

  // Get lead by ID - MUST go through SaaS executor
  static async getLeadById(
    tenantId: string,
    userId: string,
    leadId: string,
    role: string
  ) {
    return saasExecute({
      tenantId,
      userId,
      operation: 'leads.get',
      key: `leads.get:${leadId}`,
      query: async () => {
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
        
        return lead;
      },
      cache: true,
      cacheTTL: 600, // 10 minutes
    });
  }

  // Search leads - MUST go through SaaS executor
  static async searchLeads(
    tenantId: string,
    userId: string,
    role: string,
    query: string,
    limit = 20
  ) {
    return saasExecute({
      tenantId,
      userId,
      operation: 'leads.search',
      key: `leads.search:${query}:${limit}`,
      query: async () => {
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

        return results;
      },
      cache: true,
      cacheTTL: 1800, // 30 minutes for search results
    });
  }

  // Get lead statistics - MUST go through SaaS executor
  static async getLeadStats(
    tenantId: string,
    userId: string,
    role: string
  ) {
    return SaaSRoutes.executeAnalytics({
      tenantId,
      userId,
      operation: 'leads.stats',
      key: `leads.stats`,
      query: async () => {
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

        return {
          total,
          byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
            acc[item.status] = item._count;
            return acc;
          }, {} as Record<string, number>),
          recent30Days: recent,
        };
      },
      cacheTTL: 600, // 10 minutes
    });
  }
}
