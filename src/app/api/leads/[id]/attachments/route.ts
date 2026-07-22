import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';

import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { Roles, RoleType } from '@/constants/roles';

/**
 * File Attachments API
 * Handles file upload and listing for lead attachments
 * Supports multiple file formats with size limits
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

/**
 * List all attachments for a lead
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      const { id } = await context.params;
    try {
      const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
      const { searchParams } = new URL(request.url);
      
      // Pagination
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const skip = (page - 1) * limit;
      
      // Verify lead exists and user has access
      const lead = await withTimeout(
        (prisma as any).lead.findFirst({
          where: {
            id,
            isDeleted: false,
            userId: user.role === Roles.ADMIN ? undefined : user.id
          }
        }),
        5000
      );
      
      if (!lead) {
        return createCompressedResponse({
          success: false,
          error: 'Lead not found or access denied'
        }, 404);
      }
      
      // Get attachments with pagination
      const [attachments, total] = await withTimeout(
        Promise.all([
          (prisma as any).leadAttachment.findMany({
            where: {
              leadId: id,
              isDeleted: false
            },
            include: {
              lead: {
                select: { id: true, name: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
          }),
          (prisma as any).leadAttachment.count({
            where: {
              leadId: id,
              isDeleted: false
            }
          })
        ]),
        10000
      );
      
      return createCompressedResponse({
        success: true,
        data: attachments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
      
    } catch (error) {
      console.error('Attachments fetch error:', error);
      return createCompressedResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch attachments'
      }, 500);
    }
    }), { endpoint: 'attachments' }
  )(request);
}

/**
 * Upload a file attachment
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      const { id } = await context.params;
    try {
      const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
      
      // Verify lead exists and user has access
      const lead = await withTimeout(
        (prisma as any).lead.findFirst({
          where: {
            id,
            isDeleted: false,
            userId: user.role === Roles.ADMIN ? undefined : user.id
          }
        }),
        5000
      );
      
      if (!lead) {
        return createCompressedResponse({
          success: false,
          error: 'Lead not found or access denied'
        }, 404);
      }
      
      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return createCompressedResponse({
          success: false,
          error: 'No file provided'
        }, 400);
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return createCompressedResponse({
          success: false,
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
        }, 400);
      }
      
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return createCompressedResponse({
          success: false,
          error: 'File type not allowed'
        }, 400);
      }
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'attachments');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${random}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);
      
      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      // Create attachment record
      const attachment = await withTimeout(
        (prisma as any).leadAttachment.create({
          data: {
            leadId: id,
            fileName,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            filePath: `/uploads/attachments/${fileName}`,
            uploadedBy: user.id
          },
          include: {
            lead: {
              select: { id: true, name: true }
            }
          }
        }),
        10000
      );
      
      return createCompressedResponse({
        success: true,
        data: attachment,
        message: 'File uploaded successfully'
      }, 201);
      
    } catch (error) {
      console.error('File upload error:', error);
      return createCompressedResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      }, 500);
    }
    }), { endpoint: 'attachments' }
  )(request);
}
