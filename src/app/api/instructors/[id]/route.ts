import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoInstructorsMap: Record<string, any> = {
  "inst-1": {
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
    courses: [
      { id: "course-1", title: "Enterprise AI Mastery & Prompt Engineering", status: "PUBLISHED", enrollCount: 1420, rating: 4.9 }
    ],
    _count: { courses: 1 }
  },
  "inst-2": {
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
    courses: [
      { id: "course-2", title: "B2B Sales Communication & Deal Closing", status: "PUBLISHED", enrollCount: 890, rating: 4.8 }
    ],
    _count: { courses: 1 }
  },
  "inst-3": {
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
    courses: [
      { id: "course-3", title: "Advanced Cloud Architecture & Kubernetes", status: "PUBLISHED", enrollCount: 2100, rating: 4.95 }
    ],
    _count: { courses: 1 }
  },
  "inst-4": {
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
    courses: [
      { id: "course-4", title: "Executive Leadership & Organizational Strategy", status: "PUBLISHED", enrollCount: 650, rating: 4.75 }
    ],
    _count: { courses: 1 }
  }
};

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (id.startsWith("inst-") && demoInstructorsMap[id]) {
      return NextResponse.json({ success: true, data: demoInstructorsMap[id] });
    }

    const instructor = await prisma.instructor.findFirst({
      where: { id, isDeleted: false },
      include: {
        courses: {
          where: { isDeleted: false },
          select: { id: true, title: true, status: true, enrollCount: true, rating: true },
        },
        _count: { select: { courses: true } },
      },
    });

    if (!instructor) {
      return NextResponse.json({ success: false, error: 'Instructor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...instructor,
        createdAt: instructor.createdAt.toISOString(),
        updatedAt: instructor.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Instructor API] GET [id] failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch instructor' }, { status: 500 });
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
    const { name, email, phone, bio, expertise, certifications, linkedinUrl, twitterUrl, websiteUrl, isActive } = body;

    if (id.startsWith("inst-") && demoInstructorsMap[id]) {
      if (name) demoInstructorsMap[id].name = name;
      if (email) demoInstructorsMap[id].email = email;
      if (phone !== undefined) demoInstructorsMap[id].phone = phone;
      if (bio !== undefined) demoInstructorsMap[id].bio = bio;
      if (expertise) demoInstructorsMap[id].expertise = expertise;
      demoInstructorsMap[id].updatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, data: demoInstructorsMap[id] });
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        phone: phone ?? undefined,
        bio: bio ?? undefined,
        ...(expertise && { expertise }),
        ...(certifications && { certifications }),
        linkedinUrl: linkedinUrl ?? undefined,
        twitterUrl: twitterUrl ?? undefined,
        websiteUrl: websiteUrl ?? undefined,
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...instructor,
        createdAt: instructor.createdAt.toISOString(),
        updatedAt: instructor.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Instructor API] PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update instructor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (id.startsWith("inst-") && demoInstructorsMap[id]) {
      delete demoInstructorsMap[id];
      return NextResponse.json({ success: true });
    }

    await prisma.instructor.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Instructor API] DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete instructor' }, { status: 500 });
  }
}
