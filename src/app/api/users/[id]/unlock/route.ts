import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    
    // Only admins can unlock users
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    await prisma.user.update({
      where: { id },
      data: {
        lockUntil: null,
        loginAttemptCount: 0
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'User unlocked successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to unlock user'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
