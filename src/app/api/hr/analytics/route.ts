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

    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });

    const [employees, attendances, leaveRequests] = await Promise.all([
      prisma.employee.findMany({ where: { organizationId: orgId, isDeleted: false } }),
      prisma.attendance.findMany({
        where: { employee: { organizationId: orgId }, date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } }
      }),
      prisma.leaveRequest.findMany({
        where: { employee: { organizationId: orgId }, status: 'PENDING' }
      })
    ]);

    const activeCount = employees.filter((e: any) => e.status === 'ACTIVE').length;
    const totalPayroll = employees.reduce((sum: number, e: any) => sum + (e.salary || 0), 0);
    const avgSalary = activeCount > 0 ? totalPayroll / activeCount : 0;
    const leaveRequestsCount = leaveRequests.length;
    
    // Calculate real attendance rate for last 30 days
    const attendanceRate = attendances.length > 0 
      ? (attendances.filter((a: any) => a.status === 'PRESENT').length / attendances.length) * 100 
      : 0;

    // Department breakdown
    const deptBreakdown = employees.reduce((acc: any, e: any) => {
      const dept = e.department || 'Unassigned';
      if (!acc[dept]) acc[dept] = 0;
      acc[dept]++;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        activeEmployees: activeCount,
        totalPayroll,
        avgSalary,
        leaveRequestsCount,
        attendanceRate,
        departmentBreakdown: Object.entries(deptBreakdown).map(([name, count]) => ({ name, count })),
      },
    });
  } catch (error) {
    console.error('[HR Analytics API] GET failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch HR analytics' 
    }, { status: 500 });
  }
}
