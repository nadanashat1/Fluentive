import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoEmployees = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  }
];

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const departmentName = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || undefined;

    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });

    const where: any = { organizationId: orgId, isDeleted: false };
    if (departmentName) {
      where.department = { name: departmentName };
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: { department: true },
      orderBy: { firstName: 'asc' },
    });

    let resultList = employees.map((e: any) => ({
      ...e,
      department: e.department ? e.department.name : 'General',
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      joinDate: e.joinDate ? e.joinDate.toISOString() : null,
    }));

    if (resultList.length === 0) {
      resultList = demoEmployees.filter(e => {
        if (status && e.status !== status) return false;
        if (departmentName && e.department !== departmentName) return false;
        if (search) {
          const s = search.toLowerCase();
          return e.firstName.toLowerCase().includes(s) || 
                 e.lastName.toLowerCase().includes(s) || 
                 e.email.toLowerCase().includes(s) || 
                 e.position.toLowerCase().includes(s);
        }
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      data: resultList,
    });
  } catch (error) {
    console.error('[HR Employees API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, department, position, joinDate, salary, status } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization' }, { status: 400 });
    }

    let departmentId = null;
    if (department) {
      const deptName = department.trim();
      let dept = await prisma.department.findFirst({
        where: { name: deptName, organizationId: user.organizationId }
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: { name: deptName, organizationId: user.organizationId }
        });
      }
      departmentId = dept.id;
    }

    const employee = await prisma.employee.create({
      data: {
        organizationId: user.organizationId,
        firstName,
        lastName,
        email,
        phone,
        departmentId,
        position,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        salary: salary ? parseFloat(salary) : null,
        status: status || 'ACTIVE',
      },
      include: { department: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        department: employee.department ? employee.department.name : 'General',
        createdAt: employee.createdAt.toISOString(),
        updatedAt: employee.updatedAt.toISOString(),
        joinDate: employee.joinDate ? employee.joinDate.toISOString() : null,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[HR Employees API] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create employee' }, { status: 500 });
  }
}
