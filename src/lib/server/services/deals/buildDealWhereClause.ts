import { Prisma } from '@prisma/client';

import { DealListQuery } from './deal-schemas';

// Use any type temporarily until Prisma client is properly generated
export function buildDealWhereClause(query: DealListQuery): any {
  const { stage, leadId, search, minValue, maxValue } = query;

  const valueFilter =
    minValue !== undefined || maxValue !== undefined
      ? {
          ...(minValue !== undefined && { gte: minValue }),
          ...(maxValue !== undefined && { lte: maxValue }),
        }
      : undefined;

  return {
    ...(stage && { stage }),
    ...(leadId && { leadId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { lead: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
    ...(valueFilter && { value: valueFilter }),
  };
}
