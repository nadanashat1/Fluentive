import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoEmployeesMap: Record<string, any> = {
  "emp-1": {
    id: "emp-1",
    firstName: "Elena",
    lastName: "Vance",
    email: "elena.v@fluentive.com",
    phone: "+1 (555) 234-5678",
    position: "Senior HR Manager",
    department: "Human Resources",
    salary: 8500,
    status: "ACTIVE",
    joinDate: new Date("2024-01-15").toISOString(),
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date().toISOString(),
    user: { id: "u-1", name: "Elena Vance", email: "elena.v@fluentive.com", role: "MANAGER" },
  },
  "emp-2": {
    id: "emp-2",
    firstName: "Marcus",
    lastName: "Brody",
    email: "marcus.b@fluentive.com",
    phone: "+1 (555) 345-6789",
    position: "Lead Cloud Architect",
    department: "Engineering",
    salary: 12500,
    status: "ACTIVE",
    joinDate: new Date("2023-06-10").toISOString(),
    createdAt: new Date("2023-06-10").toISOString(),
    updatedAt: new Date().toISOString(),
    user: { id: "u-2", name: "Marcus Brody", email: "marcus.b@fluentive.com", role: "ENGINEER" },
  },
  "emp-3": {
    id: "emp-3",
    firstName: "Chloe",
    lastName: "Sato",
    email: "chloe.s@fluentive.com",
    phone: "+1 (555) 456-7890",
    position: "Product Designer",
    department: "Design",
    salary: 7800,
    status: "ACTIVE",
    joinDate: new Date("2024-03-20").toISOString(),
    createdAt: new Date("2024-03-20").toISOString(),
    updatedAt: new Date().toISOString(),
    user: { id: "u-3", name: "Chloe Sato", email: "chloe.s@fluentive.com", role: "DESIGNER" },
  },
  "emp-4": {
    id: "emp-4",
    firstName: "Devon",
    lastName: "Miles",
    email: "devon.m@fluentive.com",
    phone: "+1 (555) 567-8901",
    position: "Account Executive",
    department: "Sales",
    salary: 9200,
    status: "ON_LEAVE",
    joinDate: new Date("2023-11-01").toISOString(),
    createdAt: new Date("2023-11-01").toISOString(),
    updatedAt: new Date().toISOString(),
    user: { id: "u-4", name: "Devon Miles", email: "devon.m@fluentive.com", role: "SALES" },
  }
};

const demoAttendances = [
  { id: "att-1", date: new Date().toISOString(), checkIn: new Date(new Date().setHours(8, 55)).toISOString(), checkOut: new Date(new Date().setHours(17, 15)).toISOString(), status: "PRESENT", notes: "On time check-in" },
  { id: "att-2", date: new Date(Date.now() - 86400000).toISOString(), checkIn: new Date(Date.now() - 86400000).toISOString(), checkOut: new Date(Date.now() - 86400000 + 28800000).toISOString(), status: "PRESENT", notes: "" },
  { id: "att-3", date: new Date(Date.now() - 172800000).toISOString(), checkIn: new Date(Date.now() - 172800000).toISOString(), checkOut: new Date(Date.now() - 172800000 + 28800000).toISOString(), status: "PRESENT", notes: "" },
  { id: "att-4", date: new Date(Date.now() - 259200000).toISOString(), checkIn: null, checkOut: null, status: "ABSENT", notes: "Approved PTO" },
];

const demoLeaves = [
  { id: "lr-1", type: "Annual PTO", startDate: new Date(Date.now() + 864000000).toISOString(), endDate: new Date(Date.now() + 1123200000).toISOString(), reason: "Family summer vacation trip", status: "APPROVED" },
  { id: "lr-2", type: "Medical / Dental", startDate: new Date(Date.now() - 1500000000).toISOString(), endDate: new Date(Date.now() - 1450000000).toISOString(), reason: "Routine annual checkup", status: "APPROVED" },
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (id.startsWith("emp-") && demoEmployeesMap[id]) {
      const demoEmp = demoEmployeesMap[id];
      return NextResponse.json({
        success: true,
        data: {
          ...demoEmp,
          attendances: demoAttendances,
          leaveRequests: demoLeaves,
        }
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!employee || employee.isDeleted || employee.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        department: employee.department ? employee.department.name : 'General',
        createdAt: employee.createdAt.toISOString(),
        updatedAt: employee.updatedAt.toISOString(),
        joinDate: employee.joinDate ? employee.joinDate.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('[HR Employee API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { firstName, lastName, phone, position, salary, status } = body;

    if (id.startsWith("emp-") && demoEmployeesMap[id]) {
      if (firstName !== undefined) demoEmployeesMap[id].firstName = firstName;
      if (lastName !== undefined) demoEmployeesMap[id].lastName = lastName;
      if (phone !== undefined) demoEmployeesMap[id].phone = phone;
      if (position !== undefined) demoEmployeesMap[id].position = position;
      if (salary !== undefined) demoEmployeesMap[id].salary = salary !== null ? parseFloat(salary) : null;
      if (status !== undefined) demoEmployeesMap[id].status = status;
      return NextResponse.json({ success: true, data: demoEmployeesMap[id] });
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing || existing.isDeleted || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: firstName !== undefined ? firstName : existing.firstName,
        lastName: lastName !== undefined ? lastName : existing.lastName,
        phone: phone !== undefined ? phone : existing.phone,
        position: position !== undefined ? position : existing.position,
        salary: salary !== undefined ? salary !== null ? parseFloat(salary) : null : existing.salary,
        status: status !== undefined ? status : existing.status,
      },
      include: { department: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        department: updated.department ? updated.department.name : 'General',
      },
    });
  } catch (error) {
    console.error('[HR Employee API] PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (id.startsWith("emp-") && demoEmployeesMap[id]) {
      delete demoEmployeesMap[id];
      return NextResponse.json({ success: true });
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing || existing.isDeleted || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    await prisma.employee.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), status: 'TERMINATED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[HR Employee API] DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete employee' }, { status: 500 });
  }
}
