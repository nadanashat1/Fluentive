import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getLeads } from '@/lib/server/services/leads.service';

export const runtime = 'nodejs';

const csvCell = (value: unknown): string => {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      source: searchParams.get('source') || undefined,
      page: 1,
      limit: 1000
    };

    const result = await getLeads(orgId, user.id, user.role, queryParams);

    const header = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Owner', 'Created At'];
    const rows = result.leads.map((lead: any) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.status,
      lead.source,
      lead.owner?.name || lead.owner?.email || '',
      lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt
    ].map(csvCell).join(','));

    const csv = [header.join(','), ...rows].join('\r\n') + '\r\n';

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (err) {
    console.error('Leads export error:', err);
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }
}
