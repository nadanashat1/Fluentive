import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';

/**
 * Real-time Notifications API
 * Supports WebSocket-like polling for real-time updates
 * Implements notification channels and filtering
 */

export async function GET(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        const { searchParams } = new URL(request.url);
        
        // Parse query parameters - strict limits for memory
        const since = searchParams.get('since');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20); // Max 20 items
        const type = searchParams.get('type');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        
        // Query guard
        if (limit > 20) {
          return createCompressedResponse({
            success: false,
            error: 'Too many items requested - maximum 20 items allowed'
          }, 400);
        }
        
        // Build where clause
        const where: any = { userId: user.id };
        
        if (since) {
          where.createdAt = { gte: new Date(since) };
        }
        
        if (type) {
          where.type = type;
        }
        
        if (unreadOnly) {
          where.isRead = false;
        }
        
        // Get notifications with pagination
        const notifications = await withTimeout(
          (prisma as any).notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
          }),
          10000
        ) as any[];
        
        // Get unread count
        const unreadCount = await withTimeout(
          (prisma as any).notification.count({
            where: { userId: user.id, isRead: false }
          }),
          5000
        );
        
        return createCompressedResponse({
          success: true,
          data: {
            notifications: notifications as any[],
            unreadCount,
            hasMore: notifications.length === limit,
            lastUpdated: new Date().toISOString()
          }
        });
        
      } catch (error) {
        console.error('Real-time notifications error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch notifications'
        }, 500);
      }
    }), { endpoint: 'notifications-realtime' }
  )(request);
}

export async function POST(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        const body = await request.json();
        
        const { type, title, message, relatedId, relatedType } = body;
        
        if (!type || !title || !message) {
          return createCompressedResponse({
            success: false,
            error: 'Type, title, and message are required'
          }, 400);
        }
        
        // Create notification
        const notification = await withTimeout(
          (prisma as any).notification.create({
            data: {
              userId: user.id,
              type,
              title,
              message,
              relatedId,
              relatedType,
              isRead: false
            },
            include: {
              lead: {
                select: { id: true, name: true }
              },
              deal: {
                select: { id: true, name: true }
              }
            }
          }),
          10000
        );
        
        return createCompressedResponse({
          success: true,
          data: notification,
          message: 'Notification created successfully'
        }, 201);
        
      } catch (error) {
        console.error('Create notification error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create notification'
        }, 500);
      }
    }), { endpoint: 'notifications-realtime' }
  )(request);
}

export async function PUT(request: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
        const body = await request.json();
        const { notificationIds, markAsRead } = body;
        
        if (!Array.isArray(notificationIds)) {
          return createCompressedResponse({
            success: false,
            error: 'Notification IDs array is required'
          }, 400);
        }
        
        // Update notifications
        const result = await withTimeout(
          (prisma as any).notification.updateMany({
            where: {
              id: { in: notificationIds },
              userId: user.id
            },
            data: {
              isRead: markAsRead !== false,
              readAt: markAsRead !== false ? new Date() : null
            }
          }),
          10000
        );
        
        return createCompressedResponse({
          success: true,
          data: {
            updatedCount: (result as any).count,
            message: `${(result as any).count} notifications updated`
          }
        });
        
      } catch (error) {
        console.error('Update notifications error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update notifications'
        }, 500);
      }
    }), { endpoint: 'notifications-realtime' }
  )(request);
}
