import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const demoCampaignsMap: Record<string, any> = {
  "camp-1": {
    id: "camp-1",
    name: "Q2 Enterprise Cloud Scaling Ads",
    description: "Targeted LinkedIn B2B campaign for CTOs and VPs of Engineering.",
    source: "LinkedIn Ads",
    status: "ACTIVE",
    body: {},
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
  "camp-2": {
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
  "camp-3": {
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
};

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

    if (id.startsWith("camp-") && demoCampaignsMap[id]) {
      const camp = demoCampaignsMap[id];
      const estimatedLTV = 1000;
      const revenue = camp.conversions * estimatedLTV;
      const roiPct = Math.round(((revenue - camp.spent) / camp.spent) * 100);
      return NextResponse.json({
        success: true,
        data: {
          ...camp,
          revenue,
          roiPct,
          leads: camp.conversions,
          sales: Math.round(camp.conversions * 0.25),
          channel: camp.source || 'Multi-Channel',
        }
      });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id, organizationId: user.organizationId || undefined },
    });

    if (!campaign || campaign.isDeleted) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const estimatedLTV = 1000;
    const revenue = (campaign.conversions || 0) * estimatedLTV;
    const roiPct = campaign.spent > 0 ? Math.round(((revenue - campaign.spent) / campaign.spent) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        revenue,
        roiPct,
        leads: campaign.conversions || 0,
        sales: Math.round((campaign.conversions || 0) * 0.25),
        channel: campaign.source || 'Multi-Channel',
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        startDate: campaign.startDate ? campaign.startDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        endDate: campaign.endDate ? campaign.endDate.toISOString().slice(0, 10) : null,
      },
    });
  } catch (error) {
    console.error('[Campaign Details API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch campaign details' }, { status: 500 });
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
    const { name, source, budget, startDate, endDate, status } = body;

    if (id.startsWith("camp-") && demoCampaignsMap[id]) {
      const camp = demoCampaignsMap[id];
      if (name !== undefined) camp.name = name;
      if (source !== undefined) camp.source = source;
      if (budget !== undefined) camp.budget = Number(budget);
      if (status !== undefined) camp.status = status;
      return NextResponse.json({ success: true, data: camp });
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (source !== undefined) dataToUpdate.source = source;
    if (budget !== undefined) dataToUpdate.budget = Number(budget);
    if (status !== undefined) dataToUpdate.status = status;
    if (startDate !== undefined) dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) dataToUpdate.endDate = endDate ? new Date(endDate) : null;

    const campaign = await prisma.campaign.update({
      where: { id, organizationId: user.organizationId || undefined },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Campaign Details API] PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update campaign' }, { status: 500 });
  }
}
