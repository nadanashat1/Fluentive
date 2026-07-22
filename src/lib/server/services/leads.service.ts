import { prisma } from '@/lib/prisma';
import { ActivityType, LeadStatus, DealStage } from '@prisma/client';
import { logActivity } from './activity.service';
import { handleLeadQualification } from './automation.service';

/**
 * ENTERPRISE LEADS SERVICE
 * Fully scoped by organizationId for secure multi-tenant isolation.
 */

export const getLeads = async (
  organizationId: string, 
  userId: string, 
  userRole: string, 
  filters: any = {}
) => {
  const { search, status, source, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Base tenant scoping
  const where: any = { organizationId, isDeleted: false };
  
  // Role-based scoping: Standard users only see their own leads
  const normalizedRole = userRole.toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER';
  
  if (!isAdmin) {
    where.userId = userId;
  }
  
  if (status) where.status = status;
  if (source) where.source = source;
  if (filters.course) where.courseId = filters.course;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { deals: true, activities: true } }
      }
    }),
    prisma.lead.count({ where })
  ]);

  return { leads, total, page, limit };
};

export const createLead = async (data: any, organizationId: string, userId: string) => {
  const { course, notes, ...restData } = data;
  const lead = await prisma.lead.create({
    data: {
      ...restData,
      courseId: course || null,
      organizationId,
      userId
    }
  });

  if (notes) {
    await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        authorId: userId,
        content: notes
      }
    });
  }

  await logActivity({
    type: ActivityType.SYSTEM,
    description: `Lead created: ${lead.name}`,
    userId,
    organizationId,
    leadId: lead.id
  });

  return lead;
};

export const updateLead = async (
  id: string, 
  data: any, 
  organizationId: string, 
  userId: string, 
  userRole: string
) => {
  const where: any = { id, organizationId, isDeleted: false };
  
  // Verify ownership if not admin
  const normalizedRole = userRole.toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER';
  if (!isAdmin) {
    where.userId = userId;
  }

  const existingLead = await prisma.lead.findFirst({ where });
  if (!existingLead) throw new Error('Lead not found or access denied');

  const { course, notes, ...restData } = data;
  const updatePayload: any = { ...restData };
  if (course !== undefined) updatePayload.courseId = course || null;

  const lead = await prisma.lead.update({
    where: { id },
    data: updatePayload,
    include: { owner: { select: { name: true } } }
  });

  if (notes) {
    await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        authorId: userId,
        content: notes
      }
    });
  }

  // CROSS-MODULE AUTOMATION: Lead -> Deal
  if (data.status === LeadStatus.QUALIFIED && existingLead.status !== LeadStatus.QUALIFIED) {
    await prisma.deal.create({
      data: {
        organizationId,
        workspaceId: existingLead.workspaceId || 'default',
        title: `${lead.company || lead.name} - Deal`,
        value: lead.estimatedValue || 0,
        stage: DealStage.DISCOVERY,
        userId,
        leadId: lead.id
      }
    });

    await handleLeadQualification(lead.id, userId);
  }

  return lead;
};

export const deleteLead = async (id: string, organizationId: string, userId: string, userRole: string) => {
  const where: any = { id, organizationId, isDeleted: false };
  const normalizedRole = userRole.toUpperCase();
  if (normalizedRole !== 'ADMIN' && normalizedRole !== 'OWNER') {
    where.userId = userId;
  }

  const existingLead = await prisma.lead.findFirst({ where });
  if (!existingLead) throw new Error('Access denied');

  return await prisma.lead.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};

export const getLeadById = async (id: string, organizationId: string, userId: string, userRole: string) => {
  const where: any = { id, organizationId, isDeleted: false };
  const normalizedRole = userRole.toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER';
  if (!isAdmin) {
    where.userId = userId;
  }

  const lead = await prisma.lead.findFirst({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      deals: { where: { isDeleted: false } },
      activities: { orderBy: { createdAt: 'desc' }, take: 10 }
    }
  });

  if (!lead) throw new Error('Lead not found or access denied');
  return lead;
};
