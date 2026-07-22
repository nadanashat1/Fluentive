import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const course = await prisma.course.findFirst({
      where: { id, isDeleted: false },
      include: {
        instructor: { select: { id: true, name: true, avatar: true, bio: true } },
        modules: {
          orderBy: { order: 'asc' },
        },
        _count: { select: { enrollments: true, modules: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Course API] GET [id] failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { title, description, thumbnail, price, level, category, tags, status, instructorId, durationMins, totalLessons } = body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        description: description ?? undefined,
        thumbnail: thumbnail ?? undefined,
        ...(price !== undefined && { price }),
        ...(level && { level }),
        category: category ?? undefined,
        ...(tags && { tags }),
        ...(status && { status }),
        instructorId: instructorId ?? undefined,
        ...(durationMins !== undefined && { durationMins }),
        ...(totalLessons !== undefined && { totalLessons }),
      },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Course API] PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await prisma.course.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Course API] DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete course' }, { status: 500 });
  }
}
