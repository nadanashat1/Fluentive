import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id] - Get user by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentUser, error } = await requireAuth(request);
    if (error || !currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    
    // Only admins can view other users
    if (currentUser.id !== id && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 403 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    if (!dbUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: dbUser
    });
  } catch (error) {
    console.error('[GET /api/users/[id]] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch user'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentUser, error } = await requireAuth(request);
    if (error || !currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    
    // Only admins can delete users
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    await prisma.user.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentUser, error } = await requireAuth(request);
    if (error || !currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    
    // Only admins can update users
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        isActive: body.isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
