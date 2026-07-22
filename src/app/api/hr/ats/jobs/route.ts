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
    const status = searchParams.get('status') || undefined;
    const department = searchParams.get('department') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.jobPosition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('[ATS Jobs API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, department, location, employmentType, workModel, 
      salaryMin, salaryMax, description, requirements, requiredSkills, minExperience 
    } = body;

    if (!title || !department || !description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization' }, { status: 400 });
    }

    const job = await prisma.jobPosition.create({
      data: {
        organizationId: user.organizationId,
        title,
        department,
        location,
        employmentType: employmentType || 'FULL_TIME',
        workModel: workModel || 'HYBRID',
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        description,
        requirements: requirements || [],
        requiredSkills: requiredSkills || [],
        minExperience: minExperience ? parseInt(minExperience) : 0,
        hiringManagerId: user.id,
        status: 'OPEN',
        isPublished: true,
      },
    });

    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    console.error('[ATS Jobs API] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
  }
}
