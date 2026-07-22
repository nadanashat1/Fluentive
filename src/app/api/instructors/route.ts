import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoInstructors = [
  {
    id: "inst-1",
    name: "Dr. Evelyn Vance",
    email: "evelyn.vance@fluentive.com",
    phone: "+1 (555) 234-5678",
    bio: "Ph.D. in Computer Science with 12+ years of research in Neural Networks, NLP, and Enterprise AI Architectures.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    expertise: ["Artificial Intelligence", "Machine Learning", "Prompt Engineering", "Python"],
    status: "ACTIVE",
    rating: 4.9,
    createdAt: new Date("2026-01-10").toISOString(),
    updatedAt: new Date("2026-05-01").toISOString(),
    _count: { courses: 4 }
  },
  {
    id: "inst-2",
    name: "Marcus Brody",
    email: "marcus.brody@fluentive.com",
    phone: "+1 (555) 345-6789",
    bio: "Former VP of Sales at Fortune 500 tech firms. Expert in high-stakes negotiation and global sales pipeline scaling.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80",
    expertise: ["B2B Sales", "Enterprise Strategy", "Negotiation", "Key Account Management"],
    status: "ACTIVE",
    rating: 4.8,
    createdAt: new Date("2026-02-15").toISOString(),
    updatedAt: new Date("2026-05-10").toISOString(),
    _count: { courses: 3 }
  },
  {
    id: "inst-3",
    name: "Alex Rivers",
    email: "alex.rivers@fluentive.com",
    phone: "+1 (555) 456-7890",
    bio: "Principal Cloud Architect and CNCF Ambassador. Specializes in Kubernetes, AWS/GCP Multi-Cloud, and Zero-Trust DevOps.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    expertise: ["Cloud Infrastructure", "Kubernetes", "DevOps", "Microservices"],
    status: "ACTIVE",
    rating: 4.95,
    createdAt: new Date("2026-03-20").toISOString(),
    updatedAt: new Date("2026-05-12").toISOString(),
    _count: { courses: 5 }
  },
  {
    id: "inst-4",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@fluentive.com",
    phone: "+1 (555) 567-8901",
    bio: "Executive Coach and Leadership Strategist advising C-suite executives across global enterprises.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
    expertise: ["Executive Leadership", "Change Management", "Organizational Psychology", "Agile Transformation"],
    status: "ACTIVE",
    rating: 4.75,
    createdAt: new Date("2026-01-05").toISOString(),
    updatedAt: new Date("2026-05-08").toISOString(),
    _count: { courses: 2 }
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
    const status = searchParams.get('status') || undefined;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { expertise: { has: search } },
      ];
    }

    const [instructors, total] = await Promise.all([
      prisma.instructor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { courses: true } },
        },
      }),
      prisma.instructor.count({ where }),
    ]);

    let instructorList = instructors.map((i: any) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));

    let totalCount = total;

    if (instructorList.length === 0) {
      instructorList = demoInstructors.filter(inst => {
        if (status && inst.status !== status) return false;
        if (search) {
          const s = search.toLowerCase();
          return inst.name.toLowerCase().includes(s) || 
                 inst.email.toLowerCase().includes(s) || 
                 inst.expertise.some(e => e.toLowerCase().includes(s));
        }
        return true;
      });
      totalCount = instructorList.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        instructors: instructorList,
        total: totalCount,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('[Instructors API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch instructors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, bio, expertise, certifications, linkedinUrl, twitterUrl, websiteUrl } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization' }, { status: 400 });
    }

    const instructor = await prisma.instructor.create({
      data: {
        organizationId: user.organizationId,
        name,
        email,
        phone: phone || null,
        bio: bio || null,
        expertise: expertise || [],
        certifications: certifications || [],
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
        websiteUrl: websiteUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...instructor,
        createdAt: instructor.createdAt.toISOString(),
        updatedAt: instructor.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Instructors API] POST failed:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'An instructor with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create instructor' }, { status: 500 });
  }
}
