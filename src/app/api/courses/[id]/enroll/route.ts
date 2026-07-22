import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await context.params;
    const userId = user.id;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.isDeleted) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ success: false, error: 'Already enrolled in this course' }, { status: 400 });
    }

    // Create enrollment
    const [enrollment] = await prisma.$transaction([
      prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: 'ACTIVE',
          progress: 0,
        },
      }),
      prisma.course.update({
        where: { id: courseId },
        data: { enrollCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: enrollment,
    }, { status: 201 });
  } catch (error) {
    console.error('[Course Enroll API] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to enroll in course' }, { status: 500 });
  }
}
