import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getLeads, createLead } from '@/lib/server/services/leads.service';
import { Schemas } from '@/lib/server/validation/schemas';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      source: searchParams.get('source') || undefined,
      course: searchParams.get('course') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });
    }

    const result = await getLeads(orgId, user.id, user.role, queryParams);
    
    // ✅ CRITICAL: Match LeadListResponse DTO structure
    return NextResponse.json({
      success: true,
      data: {
        leads: result.leads.map((lead: any) => ({
          ...lead,
          createdAt: lead.createdAt.toISOString(),
          updatedAt: lead.updatedAt.toISOString(),
          // Ensure company exists even if null in DB
          company: lead.company || undefined,
          course: lead.courseId || undefined
        })),
        total: result.total,
        page: queryParams.page,
        limit: queryParams.limit
      }
    });
  } catch (error) {
    console.error('[Leads API] GET failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch leads' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validationResult = Schemas.LeadCreate.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors.map((e: any) => e.message).join(', ') },
        { status: 400 }
      );
    }
    
    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });
    }
    
    const lead = await createLead(validationResult.data, orgId, user.id);
    
    return NextResponse.json({
      success: true,
      data: {
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        company: lead.company || undefined,
        course: lead.courseId || undefined
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[Leads API] POST failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create lead' 
    }, { status: 500 });
  }
}
