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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createLead = async (data: any, organizationId: string, userId: string) => {
  const { course, notes, ...restData } = data;
  // `course` may be a Course UUID (internal) or free-text interest from the UI.
  // Only UUIDs can be written to the courseId foreign key; keep free text as a note.
  const courseId = course && UUID_RE.test(String(course)) ? course : null;
  const freeTextCourse = course && !courseId ? `Course Interest: ${course}` : null;
  const noteContent = [notes, freeTextCourse].filter(Boolean).join('\n');
  const lead = await prisma.lead.create({
    data: {
      ...restData,
      courseId,
      organizationId,
      userId
    }
  });

  if (noteContent) {
    await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        authorId: userId,
        content: noteContent
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
  if (course !== undefined) updatePayload.courseId = (course && UUID_RE.test(String(course))) ? course : null;

  // Build the note content here (previously referenced noteContent, which only
  // exists in createLead - that made every lead update return 500 after saving).
  const noteContent = [notes].filter(Boolean).join('\n');

  const lead = await prisma.lead.update({
    where: { id },
    data: updatePayload,
    include: { owner: { select: { name: true } } }
  });

  if (noteContent) {
    await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        authorId: userId,
        content: noteContent
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

  // Attach the same deterministic AI score shown on the AI Analytics page so the
  // lead detail view can present it (scores are computed, not persisted).
  const [engagement, recentActivityCount] = await Promise.all([
    prisma.activity.count({ where: { leadId: lead.id } }),
    prisma.activity.count({
      where: { leadId: lead.id, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    })
  ]);
  const activeDeals = (lead.deals || []).filter((d: any) => d.stage !== 'WON' && d.stage !== 'LOST');
  const estimatedValue = activeDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  const valueScore = Math.min(estimatedValue / 10000, 10);
  let charSum = 0;
  for (let i = 0; i < lead.id.length; i++) { charSum += lead.id.charCodeAt(i); }
  const baseScore = 45 + (charSum % 25);
  const aiScore = Math.round(Math.min(baseScore + (recentActivityCount * 8) + (valueScore * 3) + (engagement * 4), 98));

  return { ...lead, aiScore };
};
