import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoCourses = [
  {
    id: "course-1",
    title: "Enterprise AI Mastery & Prompt Engineering",
    description: "Master advanced LLM prompt engineering, fine-tuning, and deployment strategies for enterprise scale.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80",
    price: 499,
    level: "ADVANCED",
    category: "Artificial Intelligence",
    durationMins: 360,
    totalLessons: 24,
    status: "PUBLISHED",
    createdAt: new Date("2026-04-01").toISOString(),
    updatedAt: new Date("2026-05-10").toISOString(),
    instructor: { name: "Dr. Evelyn Vance", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80" },
    _count: { enrollments: 1420, modules: 8 }
  },
  {
    id: "course-2",
    title: "B2B Sales Communication & Deal Closing",
    description: "Learn high-ticket B2B negotiation frameworks, overcoming objections, and complex deal structuring.",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
    price: 299,
    level: "INTERMEDIATE",
    category: "Sales",
    durationMins: 240,
    totalLessons: 16,
    status: "PUBLISHED",
    createdAt: new Date("2026-03-15").toISOString(),
    updatedAt: new Date("2026-05-01").toISOString(),
    instructor: { name: "Marcus Brody", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80" },
    _count: { enrollments: 890, modules: 6 }
  },
  {
    id: "course-3",
    title: "Advanced Cloud Architecture & Kubernetes",
    description: "Complete guide to designing fault-tolerant microservices, multi-region failover, and zero-downtime deployments.",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    price: 599,
    level: "EXPERT",
    category: "Cloud Engineering",
    durationMins: 480,
    totalLessons: 32,
    status: "PUBLISHED",
    createdAt: new Date("2026-02-10").toISOString(),
    updatedAt: new Date("2026-05-15").toISOString(),
    instructor: { name: "Alex Rivers", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" },
    _count: { enrollments: 2100, modules: 12 }
  },
  {
    id: "course-4",
    title: "Executive Leadership & Organizational Strategy",
    description: "Transformational leadership principles for managing cross-functional enterprise teams and driving exponential ROI.",
    thumbnail: "https://images.unsplash.com/photo-1542744094-3a3124295971?auto=format&fit=crop&w=600&q=80",
    price: 399,
    level: "ADVANCED",
    category: "Management",
    durationMins: 180,
    totalLessons: 12,
    status: "PUBLISHED",
    createdAt: new Date("2026-01-20").toISOString(),
    updatedAt: new Date("2026-05-05").toISOString(),
    instructor: { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80" },
    _count: { enrollments: 650, modules: 5 }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const level = searchParams.get('level') || undefined;
    const status = searchParams.get('status') || undefined;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (category) where.category = category;
    if (level) where.level = level;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, name: true, avatar: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    let courseList = courses.map((c: any) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    let totalCount = total;

    if (courseList.length === 0) {
      courseList = demoCourses.filter(c => {
        if (category && c.category !== category) return false;
        if (level && c.level !== level) return false;
        if (search) {
          const s = search.toLowerCase();
          return c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s);
        }
        return true;
      });
      totalCount = courseList.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        courses: courseList,
        total: totalCount,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('[Courses API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, thumbnail, price, level, category, tags, status, instructorId, durationMins, totalLessons } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        organizationId: user.organizationId,
        title,
        description: description || null,
        thumbnail: thumbnail || null,
        price: price || 0,
        level: level || 'BEGINNER',
        category: category || null,
        tags: tags || [],
        status: status === 'ACTIVE' ? 'PUBLISHED' : (status || 'DRAFT'),
        instructorId: instructorId || null,
        durationMins: durationMins || 0,
        totalLessons: totalLessons || 0,
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
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Courses API] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create course' }, { status: 500 });
  }
}
