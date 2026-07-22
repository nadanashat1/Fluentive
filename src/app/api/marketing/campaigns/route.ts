import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoCampaigns = [
  {
    id: "camp-1",
    name: "Q2 Enterprise Cloud Scaling Ads",
    description: "Targeted LinkedIn B2B campaign for CTOs and VPs of Engineering.",
    source: "LinkedIn Ads",
    status: "ACTIVE",
    budget: 15000,
    spent: 12450,
    impressions: 485000,
    clicks: 18400,
    conversions: 340,
    roi: 245.2,
    createdAt: new Date("2026-04-01").toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date("2026-04-01").toISOString(),
    endDate: new Date("2026-06-30").toISOString(),
  },
  {
    id: "camp-2",
    name: "Google Search High Intent Keywords",
    description: "Paid search targeting CRM, AI sales, and pipeline automation keywords.",
    source: "Google Search",
    status: "ACTIVE",
    budget: 25000,
    spent: 18900,
    impressions: 890000,
    clicks: 42100,
    conversions: 820,
    roi: 334.0,
    createdAt: new Date("2026-03-15").toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date("2026-03-15").toISOString(),
    endDate: new Date("2026-06-30").toISOString(),
  },
  {
    id: "camp-3",
    name: "Retargeting Display Network",
    description: "Visual banner retargeting for website visitors who did not convert.",
    source: "Google Display",
    status: "PAUSED",
    budget: 8000,
    spent: 7950,
    impressions: 1250000,
    clicks: 15200,
    conversions: 145,
    roi: 115.8,
    createdAt: new Date("2026-02-01").toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date("2026-02-01").toISOString(),
    endDate: new Date("2026-03-31").toISOString(),
  }
];

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const source = searchParams.get('source') || undefined;
    const skip = (page - 1) * limit;

    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });

    const where: any = { organizationId: orgId, isDeleted: false };
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count({ where }),
    ]);

    let campaignsList = campaigns.map((c: any) => {
      const estimatedLTV = 1000;
      const revenue = (c.conversions || 0) * estimatedLTV;
      const roi = c.spent > 0 ? ((revenue - c.spent) / c.spent) * 100 : 0;
      
      return {
        ...c,
        roi,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        startDate: c.startDate?.toISOString(),
        endDate: c.endDate?.toISOString(),
      };
    });

    if (campaignsList.length === 0) {
      campaignsList = demoCampaigns.filter(c => {
        if (status && c.status !== status) return false;
        if (source && c.source !== source) return false;
        if (search) {
          const s = search.toLowerCase();
          return c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s);
        }
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaignsList,
        total: total > 0 ? total : demoCampaigns.length,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('[Campaigns API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, source, status, budget, startDate, endDate } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Campaign name is required' }, { status: 400 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        organizationId: user.organizationId,
        name,
        description: description || null,
        source: source || null,
        status: status || 'DRAFT',
        budget: budget || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        startDate: campaign.startDate?.toISOString(),
        endDate: campaign.endDate?.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Campaigns API] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create campaign' }, { status: 500 });
  }
}
