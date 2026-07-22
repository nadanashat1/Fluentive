import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/server/services/activity.service';
import { ActivityType } from '@prisma/client';

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
    
    const notes = await prisma.leadNote.findMany({
      where: { leadId: id },
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: notes
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch notes'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    
    const note = await prisma.leadNote.create({
      data: {
        leadId: id,
        authorId: user.id,
        content: body.content
      },
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    });

    // Log the activity
    await logActivity({
      type: ActivityType.NOTE,
      description: `Added a note to lead: ${body.content.substring(0, 50)}${body.content.length > 50 ? '...' : ''}`,
      userId: user.id,
      leadId: id
    });
    
    return NextResponse.json({
      success: true,
      data: note
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create note'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
