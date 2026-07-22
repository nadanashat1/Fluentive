import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getSystemHealth } from '@/lib/server/services/observability.service';

/**
 * ADMIN SYSTEM HEALTH API
 * Provides real-time metrics for the Monitoring Dashboard.
 */

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    
    // Only Owners and Super Admins can access monitoring
    if (error || !user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const health = await getSystemHealth();

    return NextResponse.json(health);

  } catch (err: any) {
    console.error('[Admin Health API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch health metrics' }, { status: 500 });
  }
}
