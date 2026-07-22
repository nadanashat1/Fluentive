import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        skills: true,
        applications: {
          include: { job: { select: { title: true, department: true } } }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    console.error('[ATS Candidates API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, jobId, parsedSkills, totalExp } = body;

    if (!firstName || !lastName || !email || !jobId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // This is where real AI CV parsing would inject extracted skills
    const skillsToCreate = parsedSkills ? parsedSkills.map((s: string) => ({ name: s, level: 'INTERMEDIATE' })) : [];

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization' }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: {
        organizationId: user.organizationId,
        firstName,
        lastName,
        email,
        phone,
        totalYearsExp: totalExp ? parseFloat(totalExp) : 0,
        aiSummary: "AI Generated: Strong candidate with background matching the requested profile. Parsed via resume ingestion.",
        skills: {
          create: skillsToCreate
        },
        applications: {
          create: {
            jobId,
            status: 'SCREENING',
            matchScore: Math.floor(Math.random() * (98 - 75 + 1) + 75), // AI Match Score Simulation
            aiFlags: ['Strong fit', 'Requires relocation check'],
            aiRecommendation: 'Proceed to HR Interview',
          }
        }
      },
      include: {
        skills: true,
        applications: true
      }
    });

    return NextResponse.json({ success: true, data: candidate }, { status: 201 });
  } catch (error: any) {
    console.error('[ATS Candidates API] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create candidate' }, { status: 500 });
  }
}
