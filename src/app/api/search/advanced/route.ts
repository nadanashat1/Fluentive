// Advanced search — Prisma-aligned, capped pagination, safe optional searchAnalytics.
import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { LeadStatus, DealStage } from '@prisma/client';
import type { User as ReportUser } from '@/types';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { Roles, RoleType } from '@/constants/roles';

/** Client-supplied filters (partial; keys optional). */
type SearchFilters = Record<string, unknown> & {
  status?: string;
  ownerId?: string;
  stage?: string;
  type?: string;
  role?: string;
  isActive?: boolean;
  dateRange?: { start?: string; end?: string };
  valueRange?: { min?: number; max?: number };
};

type SearchPagination = { page: number; limit: number };

/** POST body for advanced search. */
type AdvancedSearchBody = {
  query?: string;
  entities?: string[];
  filters?: SearchFilters;
  pagination?: Partial<SearchPagination>;
  sortBy?: string;
  searchType?: string;
};

type SearchSlice<T> = {
  data: T[];
  total: number;
  hasMore: boolean;
};

type AdvancedSearchResults = Partial<
  Record<'leads' | 'deals' | 'activities' | 'users', SearchSlice<unknown>>
>;

/** Delegate for optional `searchAnalytics` table (may exist only in some deployments). */
type SearchAnalyticsDelegate = {
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  findMany(args: Record<string, unknown>): Promise<Array<{ query: string; createdAt: Date }>>;
  groupBy(args: Record<string, unknown>): Promise<Array<{ query: string; _count: { id: number } }>>;
};

type LeadSearchRow = Prisma.LeadGetPayload<{
  include: {
    owner: { select: { id: true; name: true; email: true } };
    deals: { where: { isDeleted: false }; select: { id: true; value: true; stage: true } };
    activities: { select: { id: true; type: true; createdAt: true } };
    _count: { select: { deals: true; activities: true } };
  };
}>;

type DealSearchRow = Prisma.DealGetPayload<{
  include: {
    lead: { select: { id: true; name: true; email: true } };
    owner: { select: { id: true; name: true; email: true } };
    activities: { select: { id: true; type: true; createdAt: true } };
    _count: { select: { activities: true } };
  };
}>;

type ActivitySearchRow = Prisma.ActivityGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    lead: { select: { id: true; name: true } };
    deal: { select: { id: true; title: true } };
  };
}>;

type UserSearchRow = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    role: true;
    organizationId: true;
    isActive: true;
    createdAt: true;
    _count: { select: { leads: true; deals: true; activities: true } };
  };
}>;

type SearchSuggestion =
  | { type: 'recent'; text: string; timestamp: Date }
  | { type: 'popular'; text: string; count: number };

/** Vercel Hobby–friendly bound for search DB round-trips (seconds budget). */
const SEARCH_DB_MS = 4000;

export async function POST(request: Request) {
  return withRateLimit(
    withMemoryCheck(async () => {
      try {
        const authResult = await requireAuth(request);
        if (authResult.error || !authResult.user) {
          return createCompressedResponse({ success: false, error: 'Unauthorized' }, 401);
        }

        const user = authResult.user;
        const body = (await request.json()) as AdvancedSearchBody;
        const {
          query = '',
          entities = ['leads', 'deals', 'activities'],
          filters = {},
          pagination = {},
          sortBy = 'relevance',
          searchType = 'standard'
        } = body;

        const searchTerms = query.trim().toLowerCase().split(' ');
        const page = Math.max(1, pagination.page ?? 1);
        const limit = Math.min(pagination.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const results: AdvancedSearchResults = {};
        let totalResults = 0;

        for (const entity of entities) {
          switch (entity) {
            case 'leads': {
              const slice = await searchLeads(
                user as any,
                searchTerms,
                filters,
                skip,
                limit,
                sortBy,
                searchType
              );
              results.leads = slice as SearchSlice<unknown>;
              totalResults += slice.total;
              break;
            }
            case 'deals': {
              const slice = await searchDeals(
                user as any,
                searchTerms,
                filters,
                skip,
                limit,
                sortBy,
                searchType
              );
              results.deals = slice as SearchSlice<unknown>;
              totalResults += slice.total;
              break;
            }
            case 'activities': {
              const slice = await searchActivities(
                user as any,
                searchTerms,
                filters,
                skip,
                limit,
                sortBy,
                searchType
              );
              results.activities = slice as SearchSlice<unknown>;
              totalResults += slice.total;
              break;
            }
            case 'users':
              if (user.role === Roles.ADMIN) {
                const slice = await searchUsers(user.organizationId!, searchTerms, filters, skip, limit, sortBy, searchType);
                results.users = slice as SearchSlice<unknown>;
                totalResults += slice.total;
              }
              break;
          }
        }

        return createCompressedResponse({
          success: true,
          data: {
            query,
            results,
            pagination: {
              page,
              limit,
              total: totalResults,
              hasMore: skip + limit < totalResults
            },
            searchMeta: {
              entities: entities.length,
              searchType,
              sortBy,
              processedAt: new Date().toISOString()
            }
          }
        });
      } catch (error) {
        console.error('Advanced search error:', error);
        return createCompressedResponse(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Search failed'
          },
          500
        );
      }
    }),
    { endpoint: 'advanced-search' }
  )(request as any);
}

async function searchLeads(
  user: ReportUser,
  searchTerms: string[],
  filters: SearchFilters,
  skip: number,
  limit: number,
  sortBy: string,
  searchType: string
): Promise<SearchSlice<unknown>> {
  const where: Prisma.LeadWhereInput = {
    organizationId: user.organizationId!,
    ...(user.role === Roles.ADMIN ? {} : { userId: user.id }),
    isDeleted: false
  };

  if (filters.status) where.status = filters.status as LeadStatus;
  if (filters.ownerId) where.userId = filters.ownerId;
  if (filters.dateRange) {
    where.createdAt = {};
    if (filters.dateRange.start) where.createdAt.gte = new Date(filters.dateRange.start);
    if (filters.dateRange.end) where.createdAt.lte = new Date(filters.dateRange.end);
  }

  const searchConditions: Prisma.LeadWhereInput[] = searchTerms.map((term) => ({
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } }
    ]
  }));

  if (searchConditions.length > 0) {
    where.OR = searchConditions;
  }

  const total = await withTimeout(prisma.lead.count({ where }), SEARCH_DB_MS);

  let orderBy: Prisma.LeadOrderByWithRelationInput | Prisma.LeadOrderByWithRelationInput[] = {
    createdAt: 'desc'
  };
  if (sortBy === 'name') orderBy = { name: 'asc' };
  if (sortBy === 'status') orderBy = { status: 'asc' };

  const leads: LeadSearchRow[] = await withTimeout(
    prisma.lead.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        deals: {
          where: { isDeleted: false },
          select: { id: true, value: true, stage: true }
        },
        activities: {
          select: { id: true, type: true, createdAt: true }
        },
        _count: {
          select: { deals: true, activities: true }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    SEARCH_DB_MS
  );

  const scoredLeads = leads.map((lead) => ({
    ...lead,
    relevanceScore: calculateRelevanceScore(lead, searchTerms, searchType),
    totalValue: lead.deals.reduce((sum: number, deal) => sum + (deal.value || 0), 0)
  }));

  if (sortBy === 'relevance') {
    scoredLeads.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  return {
    data: scoredLeads,
    total,
    hasMore: skip + limit < total
  };
}

async function searchDeals(
  user: ReportUser,
  searchTerms: string[],
  filters: SearchFilters,
  skip: number,
  limit: number,
  sortBy: string,
  searchType: string
): Promise<SearchSlice<unknown>> {
  const where: Prisma.DealWhereInput = {
    organizationId: user.organizationId!,
    ...(user.role === Roles.ADMIN ? {} : { userId: user.id }),
    isDeleted: false
  };

  if (filters.stage) where.stage = filters.stage as DealStage;
  if (filters.ownerId) where.userId = filters.ownerId;
  if (filters.valueRange) {
    where.value = {};
    if (filters.valueRange.min !== undefined) where.value.gte = filters.valueRange.min;
    if (filters.valueRange.max !== undefined) where.value.lte = filters.valueRange.max;
  }
  if (filters.dateRange) {
    where.createdAt = {};
    if (filters.dateRange.start) where.createdAt.gte = new Date(filters.dateRange.start);
    if (filters.dateRange.end) where.createdAt.lte = new Date(filters.dateRange.end);
  }

  const searchConditions: Prisma.DealWhereInput[] = searchTerms.map((term) => ({
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      { lead: { is: { name: { contains: term, mode: 'insensitive' } } } }
    ]
  }));

  if (searchConditions.length > 0) {
    where.OR = searchConditions;
  }

  const total = await withTimeout(prisma.deal.count({ where }), SEARCH_DB_MS);

  let orderBy: Prisma.DealOrderByWithRelationInput = { createdAt: 'desc' };
  if (sortBy === 'value') orderBy = { value: 'desc' };
  if (sortBy === 'stage') orderBy = { stage: 'asc' };
  if (sortBy === 'name') orderBy = { title: 'asc' };

  const deals: DealSearchRow[] = await withTimeout(
    prisma.deal.findMany({
      where,
      include: {
        lead: {
          select: { id: true, name: true, email: true }
        },
        owner: {
          select: { id: true, name: true, email: true }
        },
        activities: {
          select: { id: true, type: true, createdAt: true }
        },
        _count: {
          select: { activities: true }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    SEARCH_DB_MS
  );

  const scoredDeals = deals.map((deal) => {
    const { owner, ...rest } = deal;
    return {
      ...rest,
      user: owner,
      relevanceScore: calculateRelevanceScore(deal, searchTerms, searchType)
    };
  });

  if (sortBy === 'relevance') {
    scoredDeals.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  return {
    data: scoredDeals,
    total,
    hasMore: skip + limit < total
  };
}

async function searchActivities(
  user: ReportUser,
  searchTerms: string[],
  filters: SearchFilters,
  skip: number,
  limit: number,
  sortBy: string,
  searchType: string
): Promise<SearchSlice<unknown>> {
  const where: Prisma.ActivityWhereInput = {
    organizationId: user.organizationId!,
    ...(user.role === Roles.ADMIN ? {} : { userId: user.id })
  };

  if (filters.type) where.type = filters.type as any;
  if (filters.ownerId) where.userId = filters.ownerId;
  if (filters.dateRange) {
    where.createdAt = {};
    if (filters.dateRange.start) where.createdAt.gte = new Date(filters.dateRange.start);
    if (filters.dateRange.end) where.createdAt.lte = new Date(filters.dateRange.end);
  }

  const searchConditions: Prisma.ActivityWhereInput[] = searchTerms.map((term) => ({
    OR: [
      { description: { contains: term, mode: 'insensitive' } }
    ]
  }));

  if (searchConditions.length > 0) {
    where.OR = searchConditions;
  }

  const total = await withTimeout(prisma.activity.count({ where }), SEARCH_DB_MS);

  let orderBy: Prisma.ActivityOrderByWithRelationInput = { createdAt: 'desc' };
  if (sortBy === 'type') orderBy = { type: 'asc' };

  const activities: ActivitySearchRow[] = await withTimeout(
    prisma.activity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        lead: {
          select: { id: true, name: true }
        },
        deal: {
          select: { id: true, title: true }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    SEARCH_DB_MS
  );

  const scoredActivities = activities.map((activity) => {
    const deal = activity.deal;
    const dealWithLegacyName =
      deal && 'title' in deal ? { ...deal, name: deal.title } : deal;
    return {
      ...activity,
      deal: dealWithLegacyName,
      relevanceScore: calculateRelevanceScore(activity, searchTerms, searchType)
    };
  });

  if (sortBy === 'relevance') {
    scoredActivities.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  return {
    data: scoredActivities,
    total,
    hasMore: skip + limit < total
  };
}

async function searchUsers(
  organizationId: string,
  searchTerms: string[],
  filters: SearchFilters,
  skip: number,
  limit: number,
  sortBy: string,
  searchType: string
): Promise<SearchSlice<unknown>> {
  const where: Prisma.UserWhereInput = {
    organizationId
  };

  if (filters.role) where.role = filters.role as any;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.dateRange) {
    where.createdAt = {};
    if (filters.dateRange.start) where.createdAt.gte = new Date(filters.dateRange.start);
    if (filters.dateRange.end) where.createdAt.lte = new Date(filters.dateRange.end);
  }

  const searchConditions: Prisma.UserWhereInput[] = searchTerms.map((term) => ({
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { organization: { name: { contains: term, mode: 'insensitive' } } }
    ]
  }));

  if (searchConditions.length > 0) {
    where.OR = searchConditions;
  }

  const total = await withTimeout(prisma.user.count({ where }), SEARCH_DB_MS);

  let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' };
  if (sortBy === 'name') orderBy = { name: 'asc' };
  if (sortBy === 'email') orderBy = { email: 'asc' };
  if (sortBy === 'role') orderBy = { role: 'asc' };

  const users: UserSearchRow[] = await withTimeout(
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { leads: true, deals: true, activities: true }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    SEARCH_DB_MS
  );

  const scoredUsers = users.map((row) => ({
    ...row,
    relevanceScore: calculateRelevanceScore(row, searchTerms, searchType)
  }));

  if (sortBy === 'relevance') {
    scoredUsers.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  return {
    data: scoredUsers,
    total,
    hasMore: skip + limit < total
  };
}

function calculateRelevanceScore(item: any, searchTerms: string[], searchType: string): number {
  let score = 0;
  const itemText = JSON.stringify(item).toLowerCase();
  searchTerms.forEach((term) => {
    if (itemText.includes(term)) score += 10;
  });
  return score;
}
