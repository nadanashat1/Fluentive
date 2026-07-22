import { prisma } from '@/lib/prisma';

import { buildDealWhereClause } from './buildDealWhereClause';
import { buildPagination } from './buildPagination';
import { DealListQuery } from './deal-schemas';

// Use type assertion to bypass TypeScript errors temporarily
const prismaClient = prisma as any;

export async function getDeals(query: DealListQuery) {
  const where = buildDealWhereClause(query);
  const { take, skip, page, limit } = buildPagination(query.page, query.limit);

  const sortBy = query.sortBy ?? 'createdAt';
  const order = query.order ?? 'desc';

  const [data, total] = await Promise.all([
    prismaClient.deal.findMany({
      where,
      take,
      skip,
      orderBy: { [sortBy]: order },
      select: {
        id: true,
        value: true,
        stage: true,
        createdAt: true,
      },
    }),
    prismaClient.deal.count({ where }),
  ]);

  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
