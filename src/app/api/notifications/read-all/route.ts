import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { withTimeout } from '@/lib/server/timeout-guard';

const NOTIFICATIONS_DB_MS = 4000;

export async function PATCH(request: Request) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(req);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

        await withTimeout(
          prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true }
          }),
          NOTIFICATIONS_DB_MS
        );

        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
          },
          { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
        );
      }
    }),
    { endpoint: 'notifications-read-all' }
  )(request);
}
