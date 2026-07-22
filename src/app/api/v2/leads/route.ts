// Leads API Routes (v2) - Using working V1 implementation
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { getLeads, createLead } from '@/lib/server/services/leads.service';

// GET /api/v2/leads - List all leads
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      source: searchParams.get('source') || undefined,
      course: searchParams.get('course') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({
        success: false,
        error: 'No organization context'
      }, { status: 400 });
    }

    const result = await getLeads(orgId, user.id, user.role ?? 'user', filters);
    
    return NextResponse.json({
      success: true,
      data: result.leads,
      count: result.leads.length,
      total: result.total,
      pagination: {
        page: result.page,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error('[GET /api/v2/leads] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch leads'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}

// POST /api/v2/leads - Create new lead
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
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Name is required'
      }, { status: 400 });
    }
    
    // Ensure required Prisma fields have defaults
    const leadData = {
      name: body.name,
      email: body.email || `${Date.now()}@placeholder.com`,
      phone: body.phone || '0000000000',
      course: body.course || 'General',
      source: body.source || 'v2-api',
      status: (body.status as string)?.toUpperCase() || 'NEW',
      priority: body.priority || 'medium',
      photo: body.photo || null,
      tags: body.tags || [],
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      lastFollowUp: body.lastFollowUp ? new Date(body.lastFollowUp) : null,
    };
    
    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({
        success: false,
        error: 'No organization context'
      }, { status: 400 });
    }
    
    const lead = await createLead(leadData, orgId, user.id);
    
    return NextResponse.json({
      success: true,
      data: lead
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v2/leads] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create lead'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
