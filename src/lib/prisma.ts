import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// v1.1.1 - Clean Client Rebuild Sync

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing. Database connection cannot be established.');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || '',
    // Supabase session pooler allows 15 clients total; cap each warm
    // serverless instance so a few concurrent instances cannot exhaust it.
    max: 4,
  }),
});

// Always cache on globalThis: in serverless production each warm instance reuses
// one client/pool instead of opening a new pool per request (prevents pooler exhaustion).
globalForPrisma.prisma = prisma;
