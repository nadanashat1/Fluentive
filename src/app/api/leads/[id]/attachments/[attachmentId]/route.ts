import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Roles, RoleType } from '@/constants/roles';

// Type interfaces for better type safety
interface AttachmentWithLead {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  lead?: {
    id: string;
    userId: string;
  };
  createdAt: Date;
}

/**
 * Delete a specific attachment
 */
export async function DELETE(request: Request, context: { params: Promise<{ id: string; attachmentId: string }> }) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      const { id, attachmentId } = await context.params;
    try {
      const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
      
      // Get attachment details before deletion
      const attachment = await withTimeout(
        (prisma as any).leadAttachment.findFirst({
          where: {
            id: attachmentId,
            leadId: id,
            isDeleted: false
          },
          include: {
            lead: {
              select: { id: true, userId: true }
            }
          }
        }),
        5000
      ) as AttachmentWithLead | null;
      
      if (!attachment) {
        return createCompressedResponse({
          success: false,
          error: 'Attachment not found'
        }, 404);
      }
      
      // Check user permissions
      if (user.role !== Roles.ADMIN && attachment.lead?.userId !== user.id) {
        return createCompressedResponse({
          success: false,
          error: 'Access denied'
        }, 403);
      }
      
      // Delete file from disk
      if (attachment.filePath) {
        try {
          const fullPath = join(process.cwd(), 'public', attachment.filePath);
          await unlink(fullPath);
        } catch (fileError) {
          console.warn('Failed to delete file from disk:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }
      
      // Soft delete attachment (mark as deleted)
      await withTimeout(
        (prisma as any).leadAttachment.update({
          where: { id: attachmentId },
          data: {
            isDeleted: true,
            deletedAt: new Date()
          }
        }),
        5000
      );
      
      return createCompressedResponse({
        success: true,
        message: 'Attachment deleted successfully'
      });
      
    } catch (error) {
      console.error('Attachment deletion error:', error);
      return createCompressedResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete attachment'
      }, 500);
    }
    }), { endpoint: 'attachments' }
  )(request);
}

/**
 * Get attachment download URL/metadata
 */
export async function GET(request: Request, context: { params: Promise<{ id: string; attachmentId: string }> }) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      const { id, attachmentId } = await context.params;
    try {
      const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
      
      // Get attachment details
      const attachment = await withTimeout(
        (prisma as any).leadAttachment.findFirst({
          where: {
            id: attachmentId,
            leadId: id,
            isDeleted: false
          },
          include: {
            lead: {
              select: { id: true, userId: true }
            }
          }
        }),
        5000
      ) as AttachmentWithLead | null;
      
      if (!attachment) {
        return createCompressedResponse({
          success: false,
          error: 'Attachment not found'
        }, 404);
      }
      
      // Check user permissions
      if (user.role !== Roles.ADMIN && attachment.lead?.userId !== user.id) {
        return createCompressedResponse({
          success: false,
          error: 'Access denied'
        }, 403);
      }
      
      return createCompressedResponse({
        success: true,
        data: {
          id: attachment.id,
          fileName: attachment.fileName,
          originalName: attachment.originalName,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          downloadUrl: attachment.filePath,
          createdAt: attachment.createdAt
        }
      });
      
    } catch (error) {
      console.error('Attachment fetch error:', error);
      return createCompressedResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch attachment'
      }, 500);
    }
    }), { endpoint: 'attachments' }
  )(request);
}
