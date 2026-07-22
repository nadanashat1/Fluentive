import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { withErrorHandler } from '@/lib/server/api-handler';
import { prisma } from '@/lib/prisma';

/**
 * ENTERPRISE UNIVERSAL SEARCH
 * Parallel fuzzy search across all business entities.
 * Fully isolated by organizationId.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireUser(request);
  const orgId = user.organizationId;
  if (!orgId) throw new Error('Organization context missing');

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Execute multi-module search in parallel for peak performance
  const [leads, deals, candidates, employees, courses, invoices] = await Promise.all([
    prisma.lead.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } }
        ],
        isDeleted: false
      },
      take: 5
    }),
    prisma.deal.findMany({
      where: {
        organizationId: orgId,
        title: { contains: query, mode: 'insensitive' },
        isDeleted: false
      },
      take: 5
    }),
    prisma.candidate.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5
    }),
    prisma.employee.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ],
        isDeleted: false
      },
      take: 5
    }),
    prisma.course.findMany({
      where: {
        organizationId: orgId,
        title: { contains: query, mode: 'insensitive' },
        isDeleted: false
      },
      take: 5
    }),
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { number: { contains: query, mode: 'insensitive' } },
          { clientName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5
    })
  ]);

  // Normalize and group results
  const results = [
    ...leads.map(l => ({ id: l.id, type: 'LEAD', title: l.name, subtitle: l.company || 'Lead', url: `/leads/${l.id}` })),
    ...deals.map(d => ({ id: d.id, type: 'DEAL', title: d.title, subtitle: `Deal • ${d.stage}`, url: `/sales-pipeline` })),
    ...candidates.map(c => ({ id: c.id, type: 'CANDIDATE', title: `${c.firstName} ${c.lastName}`, subtitle: 'ATS Candidate', url: `/hr/ats/pipeline` })),
    ...employees.map(e => ({ id: e.id, type: 'EMPLOYEE', title: `${e.firstName} ${e.lastName}`, subtitle: 'HR Employee', url: `/hr` })),
    ...courses.map(c => ({ id: c.id, type: 'COURSE', title: c.title, subtitle: 'LMS Course', url: `/courses/${c.id}` })),
    ...invoices.map(i => ({ id: i.id, type: 'INVOICE', title: i.number, subtitle: `Finance • ${i.status}`, url: `/finance` }))
  ];

  return NextResponse.json({
    success: true,
    data: results
  });
});
