// Standardized SaaS Route - THE ONLY WAY routes should work
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { EnforcedLeadsService, type LeadFilters } from '@/services/enforced-leads.service';
import type { LeadStatus } from '@prisma/client';

export const runtime = 'nodejs';

// GET /api/leads - MUST go through SaaS executor
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context (this would come from auth middleware in real implementation)
    const tenantId = (user as { organization?: string | null }).organization || 'default-tenant';

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: LeadFilters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as LeadStatus | undefined) || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    // EXECUTE THROUGH SaaS KERNEL - This is the ONLY way
    const result = await EnforcedLeadsService.getLeads(
      tenantId,
      user.id,
      user.role,
      filters
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    });

  } catch (error) {
    console.error('SaaS route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leads - MUST go through SaaS executor
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantId = (user as { organization?: string | null }).organization || 'default-tenant';

    // Parse request body
    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // EXECUTE THROUGH SaaS KERNEL - This is the ONLY way
    const result = await EnforcedLeadsService.createLead(
      tenantId,
      user.id,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        status: body.status
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    }, { status: 201 });

  } catch (error) {
    console.error('SaaS route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
