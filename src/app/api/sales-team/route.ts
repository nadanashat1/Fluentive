import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoTeamMembers = [
  {
    id: "usr-1",
    name: "Sarah Connor",
    email: "sarah.c@fluentive.com",
    role: "sales",
    isActive: true,
    createdAt: new Date("2025-01-15").toISOString(),
    _count: { leads: 42, deals: 18, activities: 156 }
  },
  {
    id: "usr-2",
    name: "Marcus Brody",
    email: "marcus.b@fluentive.com",
    role: "manager",
    isActive: true,
    createdAt: new Date("2025-02-01").toISOString(),
    _count: { leads: 38, deals: 24, activities: 210 }
  },
  {
    id: "usr-3",
    name: "Devon Miles",
    email: "devon.m@fluentive.com",
    role: "sales",
    isActive: true,
    createdAt: new Date("2025-03-10").toISOString(),
    _count: { leads: 29, deals: 14, activities: 98 }
  },
  {
    id: "usr-4",
    name: "Elena Vance",
    email: "elena.v@fluentive.com",
    role: "sales",
    isActive: true,
    createdAt: new Date("2025-04-05").toISOString(),
    _count: { leads: 51, deals: 22, activities: 184 }
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

    const where: any = { 
      isDeleted: false,
      role: { in: ['sales', 'manager', 'admin'] as any[] } 
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const teamMembers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            leads: { where: { isDeleted: false } },
            deals: { where: { isDeleted: false } },
            activities: { where: { isDeleted: false } }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    let teamList = teamMembers.map((m: any) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }));

    if (teamList.length <= 1) {
      const demoFiltered = demoTeamMembers.filter(m => {
        if (!search) return true;
        const s = search.toLowerCase();
        return m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s);
      });
      teamList = [...teamList, ...demoFiltered];
    }

    return NextResponse.json({
      success: true,
      data: teamList,
    });
  } catch (error) {
    console.error('[Sales Team API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sales team' }, { status: 500 });
  }
}
