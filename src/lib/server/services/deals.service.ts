import { prisma } from '@/lib/prisma';
import { DealStage, ActivityType } from '@prisma/client';
import { logActivity } from './activity.service';
import { handleDealWon } from './automation.service';

/**
 * ENTERPRISE DEALS SERVICE
 * Manages the sales pipeline, Kanban stages, and revenue forecasting.
 */

const demoDeals = [
  {
    id: "deal-1",
    title: "Enterprise AI Sales Platform Cloud Migration",
    value: 85000,
    stage: "DISCOVERY",
    probability: 60,
    expectedCloseDate: new Date("2026-06-30"),
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-15"),
    owner: { name: "Sarah Connor", email: "sarah.c@fluentive.com" },
    lead: { name: "Cyberdyne Systems", company: "Cyberdyne Systems" }
  },
  {
    id: "deal-2",
    title: "Global Pipeline Automation & SSO Setup",
    value: 120000,
    stage: "PROPOSAL",
    probability: 75,
    expectedCloseDate: new Date("2026-06-15"),
    createdAt: new Date("2026-04-10"),
    updatedAt: new Date("2026-05-16"),
    owner: { name: "Marcus Brody", email: "marcus.b@fluentive.com" },
    lead: { name: "Vanguard Global", company: "Vanguard Global" }
  },
  {
    id: "deal-3",
    title: "CRM Expansion & 500 Seat Licensing",
    value: 45000,
    stage: "NEGOTIATION",
    probability: 90,
    expectedCloseDate: new Date("2026-05-31"),
    createdAt: new Date("2026-05-05"),
    updatedAt: new Date("2026-05-17"),
    owner: { name: "Elena Vance", email: "elena.v@fluentive.com" },
    lead: { name: "Apex Retail Group", company: "Apex Retail Group" }
  },
  {
    id: "deal-4",
    title: "APAC Region Multi-Lingual Support Pilot",
    value: 95000,
    stage: "WON",
    probability: 100,
    expectedCloseDate: new Date("2026-05-10"),
    createdAt: new Date("2026-03-20"),
    updatedAt: new Date("2026-05-10"),
    owner: { name: "Devon Miles", email: "devon.m@fluentive.com" },
    lead: { name: "OmniTech Corp", company: "OmniTech Corp" }
  }
];

export const getDeals = async (organizationId: string, filters: any = {}) => {
  const { stage, userId, search, leadId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = { organizationId, isDeleted: false };
  
  if (stage) where.stage = stage as DealStage;
  if (userId) where.userId = userId;
  if (leadId) where.leadId = leadId;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { lead: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { name: true, email: true } },
        lead: { select: { name: true, company: true } }
      },
      skip,
      take: Number(limit)
    }),
    prisma.deal.count({ where })
  ]);

  let dealList = deals;
  let totalCount = total;

  if (dealList.length === 0) {
    dealList = demoDeals.filter(d => {
      if (stage && d.stage !== stage) return false;
      if (search) {
        const s = search.toLowerCase();
        return d.title.toLowerCase().includes(s) || d.lead.name.toLowerCase().includes(s);
      }
      return true;
    }) as any;
    totalCount = dealList.length;
  }

  // Aggregate stats for the pipeline
  const stats = {
    totalValue: dealList.reduce((acc, d) => acc + (d.value || 0), 0),
    count: totalCount
  };

  return { deals: dealList, total: totalCount, page, limit, stats };
};

export const createDeal = async (data: any, organizationId: string, userId: string) => {
  let { leadId, clientName, course, email, phone, ...dealData } = data;

  if (!leadId) {
    const leadName = clientName || "New Client";
    const newLead = await prisma.lead.create({
      data: {
        organizationId,
        userId,
        name: leadName,
        email: email || `${leadName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@example.com`,
        phone: phone || null,
        company: course || null,
        status: "NEW",
        source: "Manual Deal Entry"
      }
    });
    leadId = newLead.id;
  }

  const deal = await prisma.deal.create({
    data: {
      ...dealData,
      leadId,
      organizationId,
      userId
    }
  });

  await logActivity({
    type: ActivityType.SYSTEM,
    description: `Deal created: ${deal.title}`,
    userId,
    organizationId,
    dealId: deal.id
  });

  return deal;
};

export const updateDealStage = async (
  id: string, 
  stage: string, 
  organizationId: string, 
  userId: string
) => {
  const deal = await prisma.deal.findFirst({
    where: { id, organizationId }
  });

  if (!deal) throw new Error('Deal not found');

  const updatedDeal = await prisma.deal.update({
    where: { id },
    data: { stage: stage as DealStage },
    include: { lead: true }
  });

  await logActivity({
    type: ActivityType.SYSTEM,
    description: `Deal stage updated to ${stage}`,
    userId,
    organizationId,
    dealId: id
  });

  if (stage === DealStage.WON && deal.stage !== DealStage.WON) {
    await handleDealWon(id, userId);
  }

  return updatedDeal;
};

export const getPipelineForecast = async (organizationId: string) => {
  const deals = await prisma.deal.findMany({
    where: { organizationId, isDeleted: false, stage: { notIn: [DealStage.WON, DealStage.LOST] } },
    select: { value: true, probability: true, stage: true }
  });

  let dealList = deals;
  if (dealList.length === 0) {
    dealList = demoDeals.filter(d => d.stage !== "WON" && d.stage !== "LOST") as any;
  }

  const weightedTotal = dealList.reduce((acc, d) => acc + ((d.value || 0) * (d.probability || 0) / 100), 0);
  const totalValue = dealList.reduce((acc, d) => acc + (d.value || 0), 0);

  return {
    weightedTotal,
    totalValue,
    dealCount: dealList.length
  };
};
