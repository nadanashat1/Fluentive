import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

const demoSummary = {
  total: 6,
  active: 5,
  newThisWeek: 2,
  roleBreakdown: [
    { role: 'admin' as UserRole, count: 1 },
    { role: 'manager' as UserRole, count: 2 },
    { role: 'sales' as UserRole, count: 3 }
  ]
};

// GET /api/users/summary - Get users summary statistics
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request as any);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    const [total, active] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isActive: true, isDeleted: false } })
    ]);

    let usersSummary = {
      total,
      active,
      newThisWeek: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      roleBreakdown: (await prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true }
      })).map(r => ({
        role: r.role,
        count: r._count._all
      }))
    };

    if (usersSummary.total <= 1) {
      usersSummary = demoSummary;
    }

    return NextResponse.json({
      success: true,
      data: usersSummary
    });

  } catch (error) {
    console.error('Users summary error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users summary'
    }, { status: 500 });
  }
}
