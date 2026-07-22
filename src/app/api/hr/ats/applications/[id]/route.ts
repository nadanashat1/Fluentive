import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';
import { ActivityType } from '@/constants/enums';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization' }, { status: 400 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    // Step 1: Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        candidate: true,
        job: {
          include: {
            department: true
          }
        }
      }
    });

    // Step 2: CROSS-MODULE INTEGRATION: ATS -> HR
    // If the candidate is HIRED, automatically create an Employee record
    if (status === 'HIRED') {
      const candidate = updatedApplication.candidate;
      
      // Check if employee already exists to prevent duplicates
      const existingEmployee = await prisma.employee.findUnique({
        where: { email: candidate.email }
      });

      if (!existingEmployee) {
        await prisma.employee.create({
          data: {
            organizationId: user.organizationId,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone,
            departmentId: updatedApplication.job.departmentId,
            position: updatedApplication.job.title,
            joinDate: new Date(),
            status: 'ACTIVE',
            salary: updatedApplication.job.salaryMin || 0, // Fallback to min salary
          }
        });

        // Optional: Create global activity log for the hire
        await prisma.activity.create({
          data: {
            organizationId: user.organizationId,
            type: ActivityType.SYSTEM as any,
            description: `Candidate ${candidate.firstName} ${candidate.lastName} was hired for ${updatedApplication.job.title}`,
            userId: user.id,
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedApplication });
  } catch (error: any) {
    console.error('[ATS Application Update API] failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
  }
}
