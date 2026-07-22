import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get page views analytics
 * Migrated from old Express timeTracking.controller.ts
 */
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId') || user.id;

    const where: any = { userId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const db = prisma as any;
    const pageViews = await db.pageView.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Group by page
    const pageStats: Record<string, number> = {};
    pageViews.forEach((pv: any) => {
      pageStats[pv.page] = (pageStats[pv.page] || 0) + 1;
    });

    const topPages = Object.entries(pageStats)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        pageViews,
        topPages,
        totalViews: pageViews.length
      }
    });

  } catch (error) {
    console.error('Page views error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch page views'
    }, { status: 500 });
  }
}
