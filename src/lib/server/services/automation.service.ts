import { prisma } from '@/lib/prisma';
import { ActivityType, UserRole } from '@prisma/client';

/**
 * ENTERPRISE AUTOMATION SERVICE
 * Centralized logic for cross-module workflows and automated actions.
 * All operations are tenant-scoped using organizationId.
 */

export const createNotification = async (
  organizationId: string,
  userId: string, 
  title: string, 
  message: string, 
  type: string = 'info', 
  leadId?: string
) => {
  return prisma.notification.create({
    data: {
      organizationId,
      userId,
      title,
      message,
      type,
      leadId,
    }
  });
};

export const createAutomatedTask = async (
  organizationId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: Date;
    assigneeId: string;
    creatorId: string;
    entityType?: string;
    entityId?: string;
    leadId?: string;
  }
) => {
  return prisma.task.create({
    data: {
      organizationId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'PENDING',
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
      creatorId: data.creatorId,
      entityType: data.entityType,
      entityId: data.entityId,
      leadId: data.leadId,
    }
  });
};

// LEAD -> DEAL Workflow
export const handleLeadQualification = async (leadId: string, userId: string) => {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || !lead.organizationId) return;

  const orgId = lead.organizationId;

  // 1. Notify assigned sales rep
  await createNotification(
    orgId,
    lead.userId,
    'Lead Qualified',
    `Lead ${lead.name} has been marked as qualified. A deal has been suggested.`,
    'SUCCESS',
    lead.id
  );

  // 2. Create follow-up task
  await createAutomatedTask(orgId, {
    title: `Follow up with ${lead.name}`,
    description: `Lead qualified. Initiate first sales contact and proposal.`,
    priority: 'HIGH',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    assigneeId: lead.userId,
    creatorId: userId,
    entityType: 'LEAD',
    entityId: lead.id,
    leadId: lead.id,
  });
};

// DEAL -> FINANCE Workflow
export const handleDealWon = async (dealId: string, userId: string) => {
  const deal = await prisma.deal.findUnique({ 
    where: { id: dealId },
    include: { lead: true }
  });
  if (!deal || !deal.organizationId || !deal.lead) return;

  const orgId = deal.organizationId;

  // 1. Create Invoice Draft
  await prisma.invoice.create({
    data: {
      organizationId: orgId,
      number: `INV-${Date.now()}`,
      clientName: deal.lead.name,
      clientEmail: deal.lead.email,
      amount: deal.value || 0,
      total: deal.value || 0,
      status: 'DRAFT',
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
      dealId: deal.id
    }
  });
  
  // 2. Notify Finance Manager
  const financeManagers = await prisma.user.findMany({
    where: { 
      organizationId: orgId,
      role: { in: [UserRole.finance, UserRole.admin, UserRole.super_admin] } 
    }
  });
  
  for (const manager of financeManagers) {
    await createNotification(
      orgId,
      manager.id,
      'New Deal Won - Billing Required',
      `Deal ${deal.title} won for ${deal.value}. Please review and send invoice.`,
      'SUCCESS'
    );
  }

  // 3. Create onboarding tasks
  await createAutomatedTask(orgId, {
    title: `Onboard client: ${deal.title}`,
    description: `Deal won. Start client onboarding process.`,
    priority: 'HIGH',
    assigneeId: deal.userId,
    creatorId: userId,
    entityType: 'DEAL',
    entityId: deal.id,
    leadId: deal.leadId || undefined,
  });
};
