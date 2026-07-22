import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';

/**
 * AUTH ME API
 * Returns the currently authenticated user's profile.
 * Called by AuthKernel.bootstrapSession() on every page load.
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      organizationId: user.organizationId || null
    }
  });
}
