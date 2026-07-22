import { prisma } from '@/lib/prisma';
import { ActivityType } from '@prisma/client';

const demoActivities = [
  {
    id: "act-1",
    type: "DEAL_STAGE_CHANGED",
    description: "Deal stage updated to PROPOSAL for Vanguard Global",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    user: { name: "Marcus Brody" },
    lead: { name: "Vanguard Global" },
    deal: { title: "Global Pipeline Automation & SSO Setup" },
    leadId: "lead-2",
    dealId: "deal-2"
  },
  {
    id: "act-2",
    type: "EMAIL",
    description: "Sent follow-up proposal email and pricing summary",
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    user: { name: "Sarah Connor" },
    lead: { name: "Cyberdyne Systems" },
    deal: { title: "Enterprise AI Sales Platform Cloud Migration" },
    leadId: "lead-1",
    dealId: "deal-1"
  },
  {
    id: "act-3",
    type: "MEETING",
    description: "Completed product discovery call with APAC regional directors",
    createdAt: new Date(Date.now() - 1000 * 60 * 360),
    user: { name: "Devon Miles" },
    lead: { name: "OmniTech Corp" },
    deal: { title: "APAC Region Multi-Lingual Support Pilot" },
    leadId: "lead-4",
    dealId: "deal-4"
  },
  {
    id: "act-4",
    type: "NOTE",
    description: "Client requested custom SLA terms for 500 seat licensing",
    createdAt: new Date(Date.now() - 1000 * 60 * 720),
    user: { name: "Elena Vance" },
    lead: { name: "Apex Retail Group" },
    deal: { title: "CRM Expansion & 500 Seat Licensing" },
    leadId: "lead-3",
    dealId: "deal-3"
  }
];

export const logActivity = async (data: {
  type: ActivityType;
  description?: string;
  userId?: string;
  organizationId?: string;
  leadId?: string;
  dealId?: string;
}) => {
  try {
    return await prisma.activity.create({
      data: {
        type: data.type,
        description: data.description,
        userId: data.userId,
        organizationId: data.organizationId,
        leadId: data.leadId,
        dealId: data.dealId
      }
    });
  } catch (error) {
    console.error('[Activity Service] Failed to log activity:', error);
  }
};

export const getActivities = async (filters: {
  leadId?: string;
  dealId?: string;
  userId?: string;
  limit?: number;
}) => {
  const { leadId, dealId, userId, limit = 50 } = filters;
  
  const where: any = {};
  if (leadId) where.leadId = leadId;
  if (dealId) where.dealId = dealId;
  if (userId) where.userId = userId;

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { name: true } },
      lead: { select: { name: true } },
      deal: { select: { title: true } }
    }
  });

  if (activities.length === 0) {
    return demoActivities.filter(a => {
      if (leadId && a.leadId !== leadId) return false;
      if (dealId && a.dealId !== dealId) return false;
      return true;
    });
  }

  return activities;
};
