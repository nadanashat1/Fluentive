import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getDeals, createDeal } from '@/lib/server/services/deals.service';
import { Schemas } from '@/lib/server/validation/schemas';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      stage: searchParams.get('stage') || undefined,
      leadId: searchParams.get('leadId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };
    
    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });
    }
    
    const result = await getDeals(orgId, filters);
    
    return NextResponse.json({
      success: true,
      data: {
        deals: result.deals.map((deal: any) => ({
          ...deal,
          createdAt: deal.createdAt.toISOString(),
          updatedAt: deal.updatedAt.toISOString(),
          expectedCloseDate: deal.expectedCloseDate?.toISOString()
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
        stats: result.stats
      }
    });
  } catch (error) {
    console.error('[Deals API] GET failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch deals' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validationResult = Schemas.DealCreate.safeParse(body);
    
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
    
    const deal = await createDeal(validationResult.data, orgId, user.id);
    
    return NextResponse.json({
      success: true,
      data: {
        ...deal,
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString(),
        expectedCloseDate: deal.expectedCloseDate?.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[Deals API] POST failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create deal' 
    }, { status: 500 });
  }
}
