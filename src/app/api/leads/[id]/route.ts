import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { getLeadById, updateLead, deleteLead } from '@/lib/server/services/leads.service';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    const lead = await getLeadById(id || '', user.organizationId || '', user.id, user.role || '');
    
    return NextResponse.json({
      success: true,
      data: lead
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch lead'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const body = await request.json();
    const { id } = await params;
    
    const lead = await updateLead(id, body, user.organizationId || '', user.id, user.role || '');
    
    return NextResponse.json({
      success: true,
      data: lead
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update lead'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    await deleteLead(id, user.organizationId || '', user.id, user.role || '');
    
    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete lead'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
