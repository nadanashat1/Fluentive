import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const body = await request.json();
    
    const { currentPassword, newPassword } = body;
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, (user as any).password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Current password is incorrect'
      }, { status: 400 });
    }
    
    // Hash new password (consistent with other auth flows - 12 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change password'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
