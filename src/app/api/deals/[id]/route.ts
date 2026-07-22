import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import { updateDealStage } from '@/lib/server/services/deals.service';

const demoDealsMap: Record<string, any> = {
  "deal-1": {
    id: "deal-1",
    title: "Enterprise AI Sales Platform Cloud Migration",
    clientName: "Cyberdyne Systems",
    clientCompany: "Cyberdyne Systems",
    clientEmail: "contact@cyberdyne.sys",
    clientPhone: "+1 (555) 019-2831",
    course: "Cloud Architecture & AI",
    dealValue: 85000,
    value: 85000,
    stage: "DISCOVERY",
    probability: 60,
    assigneeName: "Sarah Connor",
    assigneeEmail: "sarah.c@fluentive.com",
    expectedCloseDate: new Date("2026-06-30").toISOString(),
    createdAt: new Date("2026-05-01").toISOString(),
    updatedAt: new Date("2026-05-15").toISOString(),
    owner: { name: "Sarah Connor", email: "sarah.c@fluentive.com" },
    lead: { name: "Cyberdyne Systems", company: "Cyberdyne Systems", email: "contact@cyberdyne.sys", phone: "+1 (555) 019-2831" }
  },
  "deal-2": {
    id: "deal-2",
    title: "Global Pipeline Automation & SSO Setup",
    clientName: "Vanguard Global",
    clientCompany: "Vanguard Global",
    clientEmail: "admin@vanguard.com",
    clientPhone: "+1 (555) 382-9102",
    course: "Enterprise Security & SSO",
    dealValue: 120000,
    value: 120000,
    stage: "PROPOSAL",
    probability: 75,
    assigneeName: "Marcus Brody",
    assigneeEmail: "marcus.b@fluentive.com",
    expectedCloseDate: new Date("2026-06-15").toISOString(),
    createdAt: new Date("2026-04-10").toISOString(),
    updatedAt: new Date("2026-05-16").toISOString(),
    owner: { name: "Marcus Brody", email: "marcus.b@fluentive.com" },
    lead: { name: "Vanguard Global", company: "Vanguard Global", email: "admin@vanguard.com", phone: "+1 (555) 382-9102" }
  },
  "deal-3": {
    id: "deal-3",
    title: "CRM Expansion & 500 Seat Licensing",
    clientName: "Apex Retail Group",
    clientCompany: "Apex Retail Group",
    clientEmail: "procurement@apex.retail",
    clientPhone: "+1 (555) 921-3049",
    course: "CRM Enterprise Licensing",
    dealValue: 45000,
    value: 45000,
    stage: "NEGOTIATION",
    probability: 90,
    assigneeName: "Elena Vance",
    assigneeEmail: "elena.v@fluentive.com",
    expectedCloseDate: new Date("2026-05-31").toISOString(),
    createdAt: new Date("2026-05-05").toISOString(),
    updatedAt: new Date("2026-05-17").toISOString(),
    owner: { name: "Elena Vance", email: "elena.v@fluentive.com" },
    lead: { name: "Apex Retail Group", company: "Apex Retail Group", email: "procurement@apex.retail", phone: "+1 (555) 921-3049" }
  },
  "deal-4": {
    id: "deal-4",
    title: "APAC Region Multi-Lingual Support Pilot",
    clientName: "OmniTech Corp",
    clientCompany: "OmniTech Corp",
    clientEmail: "asia.leads@omnitech.io",
    clientPhone: "+65 6789 0123",
    course: "Multi-Lingual CRM Pilot",
    dealValue: 95000,
    value: 95000,
    stage: "WON",
    probability: 100,
    assigneeName: "Devon Miles",
    assigneeEmail: "devon.m@fluentive.com",
    expectedCloseDate: new Date("2026-05-10").toISOString(),
    createdAt: new Date("2026-03-20").toISOString(),
    updatedAt: new Date("2026-05-10").toISOString(),
    owner: { name: "Devon Miles", email: "devon.m@fluentive.com" },
    lead: { name: "OmniTech Corp", company: "OmniTech Corp", email: "asia.leads@omnitech.io", phone: "+65 6789 0123" }
  }
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    
    if (id.startsWith("deal-") && demoDealsMap[id]) {
      return NextResponse.json({ success: true, data: demoDealsMap[id] });
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid deal ID format'
      }, { status: 400 });
    }
    
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        lead: true,
        owner: { select: { name: true, email: true } },
      }
    });
    
    if (!deal) {
      return NextResponse.json({
        success: false,
        message: 'Deal not found'
      }, { status: 404 });
    }
    
    const enrichedDeal = {
      ...deal,
      clientName: deal.lead?.name || "Client",
      clientCompany: deal.lead?.company || "",
      clientEmail: deal.lead?.email || "",
      clientPhone: deal.lead?.phone || "",
      course: deal.title,
      dealValue: deal.value,
      assigneeName: deal.owner?.name || "Sales Agent",
      assigneeEmail: deal.owner?.email || "",
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.toISOString() : deal.createdAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: enrichedDeal
    });
  } catch (error) {
    console.error('[GET /api/deals/[id]] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch deal'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { stage, value, title, probability } = body;

    if (id.startsWith("deal-") && demoDealsMap[id]) {
      if (stage !== undefined) demoDealsMap[id].stage = stage;
      if (value !== undefined) {
        demoDealsMap[id].value = Number(value);
        demoDealsMap[id].dealValue = Number(value);
      }
      if (title !== undefined) demoDealsMap[id].title = title;
      if (probability !== undefined) demoDealsMap[id].probability = Number(probability);
      demoDealsMap[id].updatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, data: demoDealsMap[id] });
    }

    if (stage && !value && !title && !probability) {
      const updatedDeal = await updateDealStage(id, stage, user.organizationId || '', user.id);
      return NextResponse.json({ success: true, data: updatedDeal });
    }

    const dataToUpdate: any = {};
    if (stage !== undefined) dataToUpdate.stage = stage;
    if (value !== undefined) dataToUpdate.value = Number(value);
    if (title !== undefined) dataToUpdate.title = title;
    if (probability !== undefined) dataToUpdate.probability = Number(probability);

    const updated = await prisma.deal.update({
      where: { id },
      data: dataToUpdate,
      include: { lead: true }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[PATCH /api/deals/[id]] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update deal'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(request, { params });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;

    if (id.startsWith("deal-") && demoDealsMap[id]) {
      delete demoDealsMap[id];
      return NextResponse.json({ success: true, message: 'Deal deleted successfully' });
    }

    await prisma.deal.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });

    return NextResponse.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete deal'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
