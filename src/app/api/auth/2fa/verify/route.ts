import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';

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
    
    if (!(user as any).twoFactorEnabled) {
      return NextResponse.json({
        success: false,
        message: '2FA is not enabled'
      }, { status: 400 });
    }
    
    // Simple 2FA verification - in production, use otplib or similar
    // For now, accept any 6-digit token
    const isValid = body.token && body.token.length === 6 && /^\d+$/.test(body.token);
    
    if (!isValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid 2FA token'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: '2FA verified successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify 2FA'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
