// Database service layer abstraction for users
import { prisma } from '@/lib/prisma';
import { getOrSetCache, CacheKeys, cache } from '@/lib/cache/redis-cache';

export class UsersService {
  // Get user by ID with caching
  static async getUserById(id: string) {
    const cacheKey = CacheKeys.USER_PROFILE(id);
    
    return getOrSetCache(cacheKey, async () => {
      return prisma.user.findFirst({
        where: { id, isDeleted: false },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    }, 1800); // 30 minute cache
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        password: true,
        loginAttemptCount: true,
        lockUntil: true,
      }
    });
  }

  // Create user
  static async createUser(data: any) {
    const user = await prisma.user.create({
      data: {
        ...data,
        isActive: true,
        isDeleted: false
      }
    });
    
    // Invalidate any relevant caches
    await cache.clear();
    
    return user;
  }

  // Update user
  static async updateUser(id: string, data: any) {
    const user = await prisma.user.update({
      where: { id, isDeleted: false },
      data
    });
    
    // Invalidate user profile cache
    await cache.del(CacheKeys.USER_PROFILE(id));
    
    return user;
  }

  // Get users list (admin only)
  static async getUsersList(filters: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 20, search } = filters;
    const skip = (page - 1) * limit;
    
    const where: any = { isDeleted: false };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.user.count({ where })
    ]);
    
    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };
  }

  // Lock user (security)
  static async lockUser(id: string, reason: string, lockedBy: string) {
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        loginAttemptCount: { increment: 1 }
      }
    });
    
    // Invalidate user cache
    await cache.del(CacheKeys.USER_PROFILE(id));
  }

  // Unlock user
  static async unlockUser(id: string) {
    await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        lockUntil: null,
        loginAttemptCount: 0
      }
    });
    
    // Invalidate user cache
    await cache.del(CacheKeys.USER_PROFILE(id));
  }
}
