import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/middleware/auth';

/**
 * Track page views — persists optional `pageView` row (legacy delegate) + `Activity`.
 */
export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          error: 'Path is required'
        },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const pageView = await db.pageView.create({
      data: {
        userId: user.id,
        path,
        page: path,
        createdAt: new Date()
      }
    });

    await prisma.activity.create({
      data: {
        type: 'PAGE_VIEW',
        description: JSON.stringify({ path, label: 'Page View' }),
        userId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: pageView
    });
  } catch (error) {
    console.error('Page view tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track page view'
      },
      { status: 500 }
    );
  }
}
