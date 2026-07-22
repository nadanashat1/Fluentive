import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoTimelineActivities = [
  {
    id: "time-1",
    type: "SYSTEM",
    description: "Invoice INV-2026-0042 paid by Global Logistics Alliance ($15,950)",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: { name: "Billing Automation", role: "system" },
    deal: null,
    lead: { name: "Global Logistics", company: "Global Logistics Alliance" }
  },
  {
    id: "time-2",
    type: "STATUS_CHANGE",
    description: "Deal stage updated to PROPOSAL for Vanguard Global ($120,000)",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user: { name: "Marcus Brody", role: "manager" },
    deal: { title: "Global Pipeline Automation & SSO Setup", stage: "PROPOSAL" },
    lead: { name: "Vanguard Global", company: "Vanguard Global" }
  },
  {
    id: "time-3",
    type: "NOTE_ADDED",
    description: "Added internal note: 'Client requested custom SLA terms for 500 seat licensing'",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user: { name: "Elena Vance", role: "sales" },
    deal: { title: "CRM Expansion & 500 Seat Licensing", stage: "NEGOTIATION" },
    lead: { name: "Apex Retail Group", company: "Apex Retail Group" }
  },
  {
    id: "time-4",
    type: "SYSTEM",
    description: "New deal created: Enterprise AI Sales Platform Cloud Migration ($85,000)",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    user: { name: "Sarah Connor", role: "sales" },
    deal: { title: "Enterprise AI Sales Platform Cloud Migration", stage: "DISCOVERY" },
    lead: { name: "Cyberdyne Systems", company: "Cyberdyne Systems" }
  },
  {
    id: "time-5",
    type: "STATUS_CHANGE",
    description: "Lead status converted to QUALIFIED for OmniTech Corp",
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    user: { name: "Devon Miles", role: "sales" },
    deal: null,
    lead: { name: "OmniTech Corp", company: "OmniTech Corp" }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const filterType = searchParams.get('type') || undefined;

    const where: any = {};
    if (filterType && filterType !== 'ALL') where.type = filterType;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lead: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true, stage: true } }
      }
    });

    let resultList = activities.map((a: any) => ({
      ...a,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    }));

    if (resultList.length === 0) {
      resultList = demoTimelineActivities.filter(a => {
        if (!filterType || filterType === 'ALL') return true;
        return a.type === filterType;
      });
    }

    return NextResponse.json({
      success: true,
      data: resultList,
    });
  } catch (error) {
    console.error('[Global Timeline API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch global timeline' }, { status: 500 });
  }
}
