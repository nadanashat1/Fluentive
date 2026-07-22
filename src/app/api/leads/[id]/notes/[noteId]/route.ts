import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    const { id, noteId } = await params;

    const existing = await prisma.leadNote.findFirst({
      where: { id: noteId, leadId: id }
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Note not found' }, { status: 404 });
    }

    await prisma.leadNote.delete({
      where: { id: noteId }
    });
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete note'
    }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
