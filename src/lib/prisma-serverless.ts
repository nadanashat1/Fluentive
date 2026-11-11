import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing. Database connection cannot be established.');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

// Always cache on globalThis: serverless warm instances reuse one client/pool.
globalForPrisma.prisma = prisma;
