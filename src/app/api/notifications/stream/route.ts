import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';

/**
 * Real-time Notification Stream API
 * Uses Server-Sent Events (SSE) for real-time updates
 * Provides persistent connection for live notifications
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
        
        // Set up SSE headers
        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Create a readable stream for SSE
        const stream = new ReadableStream({
          start(controller) {
            // Send initial connection message
            controller.enqueue(`data: ${JSON.stringify({
              type: 'connected',
              message: 'Connected to notification stream',
              userId: user.id,
              timestamp: new Date().toISOString()
            })}\n\n`);

            // Poll for new notifications every 5 seconds
            const pollInterval = setInterval(async () => {
              try {
                // Get unread notifications
                const notifications = await withTimeout(
                  (prisma as any).notification.findMany({
                    where: {
                      userId: user.id,
                      isRead: false,
                      createdAt: {
                        gte: new Date(Date.now() - 60000) // Last minute
                      }
                    },
                    include: {
                      lead: {
                        select: { id: true, name: true }
                      },
                      deal: {
                        select: { id: true, name: true }
                      }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                  }),
                  5000
                ) as any[];

                if (notifications.length > 0) {
                  controller.enqueue(`data: ${JSON.stringify({
                    type: 'notifications',
                    data: notifications as any[],
                    count: notifications.length,
                    timestamp: new Date().toISOString()
                  })}\n\n`);
                }

                // Send heartbeat
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'heartbeat',
                  timestamp: new Date().toISOString()
                })}\n\n`);

              } catch (error) {
                console.error('SSE polling error:', error);
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'error',
                  message: 'Error fetching notifications',
                  timestamp: new Date().toISOString()
                })}\n\n`);
              }
            }, 5000);

            // Clean up on connection close
            request.signal.addEventListener('abort', () => {
              clearInterval(pollInterval);
              controller.close();
            });

            // Auto-close after 30 minutes to prevent memory leaks
            setTimeout(() => {
              clearInterval(pollInterval);
              controller.close();
            }, 30 * 60 * 1000);

          }
        });

        return new Response(stream, { headers });

      } catch (error) {
        console.error('Notification stream error:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create notification stream'
        }, { status: 500 });
      }
    }), { endpoint: 'notifications-stream' }
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
        
        const { type, title, message, relatedId, relatedType, priority = 'normal' } = body;
        
        if (!type || !title || !message) {
          return NextResponse.json({
            success: false,
            error: 'Type, title, and message are required'
          }, { status: 400 });
        }
        
        // Create high-priority notification for real-time delivery
        const notification = await withTimeout(
          (prisma as any).notification.create({
            data: {
              userId: user.id,
              type,
              title,
              message,
              relatedId,
              relatedType,
              priority,
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
        
        // Trigger real-time notification to connected clients
        // This would normally be handled by a WebSocket server or message queue
        // For now, we'll rely on the polling mechanism
        
        return NextResponse.json({
          success: true,
          data: notification,
          message: 'Real-time notification created successfully'
        }, { status: 201 });
        
      } catch (error) {
        console.error('Create real-time notification error:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create notification'
        }, { status: 500 });
      }
    }), { endpoint: 'notifications-stream' }
  )(request);
}
