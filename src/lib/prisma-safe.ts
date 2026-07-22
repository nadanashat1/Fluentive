import { prisma } from '@/lib/prisma-serverless';

/** Typed escape hatch for delegates not yet on generated Prisma types (e.g. Metric/Log). */
export const db = prisma as any;
