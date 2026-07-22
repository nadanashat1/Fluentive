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

    const [jobs, candidates, applications] = await Promise.all([
      prisma.jobPosition.findMany({ where: { status: 'OPEN' } }),
      prisma.candidate.count(),
      prisma.application.findMany()
    ]);

    const activeApplications = applications.filter((a: any) => 
      !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(a.status)
    ).length;

    const hiredCount = applications.filter((a: any) => a.status === 'HIRED').length;

    // Funnel distribution
    const funnel = {
      applied: applications.length,
      screening: applications.filter((a: any) => ['SCREENING', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'ASSESSMENT', 'OFFERED', 'HIRED'].includes(a.status)).length,
      interviewing: applications.filter((a: any) => ['HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'ASSESSMENT', 'OFFERED', 'HIRED'].includes(a.status)).length,
      offered: applications.filter((a: any) => ['OFFERED', 'HIRED'].includes(a.status)).length,
      hired: hiredCount
    };

    return NextResponse.json({
      success: true,
      data: {
        openJobs: jobs.length,
        totalCandidates: candidates,
        activeApplications,
        hiredThisMonth: hiredCount,
        funnel,
        // Mock trends for charts
        timeToHire: 18, // Days
        conversionRate: applications.length > 0 ? (hiredCount / applications.length) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('[ATS Analytics API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ATS analytics' }, { status: 500 });
  }
}
