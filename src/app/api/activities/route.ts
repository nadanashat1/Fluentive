import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getActivities } from '@/lib/server/services/activity.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const filters = {
      leadId: searchParams.get('leadId') || undefined,
      dealId: searchParams.get('dealId') || undefined,
      userId: searchParams.get('userId') || undefined,
      limit: parseInt(searchParams.get('limit') || '50')
    };
    
    const activities = await getActivities(filters);
    
    return NextResponse.json({
      success: true,
      data: activities.map((a: any) => ({
        ...a,
        createdAt: a.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('[Activities API] GET failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch activities' 
    }, { status: 500 });
  }
}
