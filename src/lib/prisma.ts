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
  }),
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
