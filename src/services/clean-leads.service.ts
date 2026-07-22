// Clean Service Layer - Pure business logic ONLY
import { type Lead } from '@prisma/client';
import { LeadRepository, CreateLeadData, UpdateLeadData, LeadFilters } from '@/repositories/lead.repository';
import { CacheService } from '@/infrastructure/cache.service';
import { EventBus } from '@/infrastructure/event-bus';
import { Roles, RoleType } from '@/constants/roles';

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  recent30Days: number;
}

export interface PaginatedLeads {
  leads: any[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class CleanLeadsService {
  // Pure business logic - NO infrastructure
  static async createLead(tenantId: string, userId: string, data: CreateLeadData) {
    // Business validation
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    // Create lead with user context
    const leadData = { ...data, userId };
    const lead = await LeadRepository.create(leadData);
    
    // Emit event for observability (async, non-blocking)
    EventBus.emit('lead.created', {
      tenantId,
      userId,
      leadId: lead.id,
      timestamp: new Date(),
    });

    // Invalidate cache
    await CacheService.invalidate(`leads:${tenantId}:list:*`);
    
    return lead;
  }

  static async getLeads(
    tenantId: string, 
    userId: string, 
    role: string, 
    filters: LeadFilters = {}
  ): Promise<PaginatedLeads> {
    // Business logic for access control
    const isAdmin = role === Roles.ADMIN;
    
    // Try cache first
    const cacheKey = `leads:${tenantId}:list:${JSON.stringify(filters)}`;
    const cached = await CacheService.get<PaginatedLeads>(cacheKey);
    if (cached) {
      EventBus.emit('lead.cache_hit', { tenantId, operation: 'getLeads' });
      return cached;
    }

    // Get from repository
    const result = await LeadRepository.findMany(filters, userId, isAdmin);
    
    // Cache result
    await CacheService.set(cacheKey, result, 300); // 5 minutes
    
    EventBus.emit('lead.retrieved', {
      tenantId,
      userId,
      count: result.leads.length,
      total: result.total,
    });

    return result;
  }

  static async getLeadById(
    tenantId: string, 
    userId: string, 
    leadId: string, 
    role: string
  ) {
    // Business logic for access control
    const isAdmin = role === Roles.ADMIN;
    
    // Try cache first
    const cacheKey = `leads:${tenantId}:get:${leadId}`;
    const cached = await CacheService.get<Lead | null>(cacheKey);
    if (cached) {
      EventBus.emit('lead.cache_hit', { tenantId, operation: 'getLeadById' });
      return cached;
    }

    // Get from repository
    const lead = await LeadRepository.findById(leadId, isAdmin ? undefined : userId);
    
    if (lead) {
      // Cache result
      await CacheService.set(cacheKey, lead, 600); // 10 minutes
      
      EventBus.emit('lead.retrieved', {
        tenantId,
        userId,
        leadId,
        found: true,
      });
    }

    return lead;
  }

  static async updateLead(
    tenantId: string, 
    userId: string, 
    leadId: string, 
    data: UpdateLeadData
  ) {
    // Business validation
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.name && data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    // Update in repository
    const lead = await LeadRepository.update(leadId, data, userId);
    
    // Emit event
    EventBus.emit('lead.updated', {
      tenantId,
      userId,
      leadId,
      changes: Object.keys(data),
    });

    // Invalidate caches
    await CacheService.invalidate(`leads:${tenantId}:*`);
    
    return lead;
  }

  static async deleteLead(tenantId: string, userId: string, leadId: string) {
    // Business logic - check if lead can be deleted
    const lead = await LeadRepository.findById(leadId, userId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Soft delete in repository
    await LeadRepository.softDelete(leadId, userId);
    
    // Emit event
    EventBus.emit('lead.deleted', {
      tenantId,
      userId,
      leadId,
    });

    // Invalidate caches
    await CacheService.invalidate(`leads:${tenantId}:*`);
    
    return { deleted: true };
  }

  static async searchLeads(
    tenantId: string, 
    userId: string, 
    role: string, 
    query: string, 
    limit = 20
  ) {
    // Business logic for search validation
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const isAdmin = role === Roles.ADMIN;
    
    // Try cache first
    const cacheKey = `leads:${tenantId}:search:${query}:${limit}`;
    const cached = await CacheService.get<Lead[]>(cacheKey);
    if (cached) {
      EventBus.emit('lead.cache_hit', { tenantId, operation: 'searchLeads' });
      return cached;
    }

    // Search in repository
    const results = await LeadRepository.search(query, limit, userId, isAdmin);
    
    // Cache results longer for searches
    await CacheService.set(cacheKey, results, 1800); // 30 minutes
    
    EventBus.emit('lead.searched', {
      tenantId,
      userId,
      query,
      count: results.length,
    });

    return results;
  }

  static async getLeadStats(
    tenantId: string, 
    userId: string, 
    role: string
  ): Promise<LeadStats> {
    const isAdmin = role === Roles.ADMIN;
    
    // Try cache first
    const cacheKey = `leads:${tenantId}:stats`;
    const cached = await CacheService.get<LeadStats>(cacheKey);
    if (cached) {
      EventBus.emit('lead.cache_hit', { tenantId, operation: 'getLeadStats' });
      return cached;
    }

    // Get stats from repository
    const stats = await LeadRepository.getStats({}, userId, isAdmin);
    
    // Cache stats
    await CacheService.set(cacheKey, stats, 600); // 10 minutes
    
    EventBus.emit('lead.stats_retrieved', {
      tenantId,
      userId,
      total: stats.total,
    });

    return stats;
  }

  // Private business logic helpers
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Business logic: check if user can access lead
  static async canUserAccessLead(
    tenantId: string, 
    userId: string, 
    leadId: string, 
    role: string
  ): Promise<boolean> {
    const isAdmin = role === Roles.ADMIN;
    
    if (isAdmin) {
      return true; // Admin can access any lead
    }

    const lead = await LeadRepository.findById(leadId);
    return lead?.userId === userId;
  }

  // Business logic: check if tenant has reached lead limit
  static async hasTenantReachedLeadLimit(tenantId: string, currentCount: number): Promise<boolean> {
    // This would check tenant subscription limits
    // For now, return false (no limit)
    return false;
  }

  // Business logic: validate lead data
  static validateLeadData(data: Partial<CreateLeadData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.name && data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (data.phone && data.phone.length < 10) {
      errors.push('Phone must be at least 10 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
