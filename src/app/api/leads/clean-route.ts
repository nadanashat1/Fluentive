// Clean SaaS Route - Stripe-style simple route
import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/middleware/tenant-middleware';
import { LeadsService } from '@/services/leads.service';

export const runtime = 'nodejs';

// GET /api/leads - Simple, clean, modular
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withTenant(request, async (context) => {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    // Direct service call - simple, fast, cacheable
    const result = await LeadsService.getLeads(
      context.tenantId,
      context.userId,
      context.role,
      filters
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  });
}

// POST /api/leads - Simple, clean, modular
export async function POST(request: NextRequest): Promise<NextResponse> {
  return withTenant(request, async (context) => {
    const body = await request.json();
    
    // Simple validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Direct service call - simple, fast, invalidates cache
    const result = await LeadsService.createLead(
      context.tenantId,
      context.userId,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        status: body.status
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  });
}
