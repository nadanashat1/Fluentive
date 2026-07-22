// Stripe-Style Route - Clean, simple, zero overhead
import { NextRequest, NextResponse } from 'next/server';
import { withSimpleAuth } from '@/middleware/simple-auth';
import { CleanLeadsService } from '@/services/clean-leads.service';

export const runtime = 'nodejs';

// GET /api/leads - Zero overhead route
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withSimpleAuth(request, async (user) => {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    // Direct service call - ZERO overhead
    const result = await CleanLeadsService.getLeads(
      user.organization || 'default-tenant',
      user.id,
      user.role,
      filters
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  });
}

// POST /api/leads - Zero overhead route
export async function POST(request: NextRequest): Promise<NextResponse> {
  return withSimpleAuth(request, async (user) => {
    const body = await request.json();
    
    // Simple validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Direct service call - ZERO overhead
    const result = await CleanLeadsService.createLead(
      user.organization || 'default-tenant',
      user.id,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        status: body.status,
        userId: user.id
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  });
}
