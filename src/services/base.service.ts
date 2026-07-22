import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export abstract class BaseService {
  protected prisma = prisma;

  // Ownership validation helper
  protected assertOwnership(resourceUserId: string, currentUserId: string): void {
    if (resourceUserId !== currentUserId) {
      throw new Error('FORBIDDEN');
    }
  }

  // Soft delete standardization
  protected getSoftDeleteFilter() {
    return {
      isDeleted: false,
    };
  }

  // Pagination helper
  protected getPaginationParams(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  // Search helper
  protected getSearchFilter(search: string, fields: string[]) {
    return {
      OR: fields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' as const }
      }))
    };
  }

  // Transaction wrapper
  protected async withTransaction<T>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  // Error standardization
  protected handleError(error: any, context: string): never {
    console.error(`[${context}]`, error);
    
    // Map common errors to standard responses
    if (error.code === 'P2025') {
      throw new Error('NOT_FOUND');
    }
    
    if (error.code === 'P2002') {
      throw new Error('DUPLICATE');
    }
    
    throw error;
  }
}
