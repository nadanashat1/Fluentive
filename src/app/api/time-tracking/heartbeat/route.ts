import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/auth';
import { eventBus } from '@/core/eventBus';
import { ActivityType } from '@prisma/client';

/**
 * Heartbeat endpoint - Called every minute from frontend
 * Updates last activity timestamp and calculates work time
 * Includes idle detection
 * Migrated from old Express timeTracking.controller.ts - EXACT LOGIC
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON body'
      }, { status: 400 });
    }

    const userId = user.id;
    const organizationId = user.organizationId;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent');

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // CRITICAL FIX: Use proper pattern to avoid time drift
    // Step 1: Get existing record BEFORE any updates
    const existingTimeTracking = await prisma.timeTracking.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });

    // Step 2: Calculate time difference using PREVIOUS heartbeat value
    const now = new Date();
    const lastHeartbeat = existingTimeTracking?.lastHeartbeat || now; // Use now if first heartbeat
    let timeSinceLastHeartbeat = Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000);
    
    // CRITICAL FIX: Prevent double-counting from multiple tabs
    // Clamp to reasonable maximum (60s + 5s buffer) to prevent time jumps
    timeSinceLastHeartbeat = Math.min(timeSinceLastHeartbeat, 65);
    if (timeSinceLastHeartbeat < 0) timeSinceLastHeartbeat = 0;

    // Step 3: Calculate total time since login
    const loginTime = existingTimeTracking?.loginTime || now;
    const totalSeconds = Math.floor((now.getTime() - loginTime.getTime()) / 1000);

    // Step 4: Prepare update data with calculated values
    const updateData: any = {
      lastHeartbeat: now,
      lastActivity: now,
      totalSeconds,
      isIdle: body.isIdle || false,
      isActive: true
    };

    // Step 5: Calculate active/idle seconds based on PREVIOUS state
    if (body.isIdle) {
      // User is idle - add to idle seconds
      updateData.idleSeconds = (existingTimeTracking?.idleSeconds || 0) + timeSinceLastHeartbeat;
    }
    else {
      // User is active - add to active seconds
      updateData.activeSeconds = (existingTimeTracking?.activeSeconds || 0) + timeSinceLastHeartbeat;
    }

    // Step 6: Database operations
    
    // Update user last activity
    await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: now
      }
    });

    let timeTrackingResult;
    if (existingTimeTracking) {
      // Update existing record with calculated values
      timeTrackingResult = await prisma.timeTracking.update({
        where: { id: existingTimeTracking.id },
        data: updateData
      });
    } else {
      // Create new record
      timeTrackingResult = await prisma.timeTracking.create({
        data: {
          userId,
          date: today,
          loginTime: now,
          totalSeconds: 0,
          activeSeconds: 0,
          idleSeconds: 0,
          isActive: true,
          isIdle: body.isIdle || false,
          lastHeartbeat: now,
          lastActivity: now,
          ip,
          userAgent
        }
      });
    }

    // Heartbeat activity logging removed to prevent DB bloat

    // Update session last activity
    await prisma.session.updateMany({
      where: { userId, revoked: false },
      data: { updatedAt: new Date() }
    });

    // Calculate productivity score
    const activeSeconds = timeTrackingResult.activeSeconds || 0;
    const currentTotalSeconds = timeTrackingResult.totalSeconds || 1;
    const productivityScore = Math.round((activeSeconds / currentTotalSeconds) * 100);

    const result = {
      totalSeconds: currentTotalSeconds,
      totalHours: (currentTotalSeconds / 3600).toFixed(2),
      activeSeconds,
      idleSeconds: timeTrackingResult.idleSeconds || 0,
      activeHours: (activeSeconds / 3600).toFixed(2),
      idleHours: ((timeTrackingResult.idleSeconds || 0) / 3600).toFixed(2),
      isIdle: body.isIdle || false,
      productivityScore,
      isActive: true
    };

    // Broadcast real-time updates via Event Bus
    eventBus.emit('time_tracking:heartbeat', {
      userId,
      ...result,
      timestamp: new Date().toISOString()
    });

    // Emit user online status
    eventBus.emit('user:online', {
      userId,
      userName: user.name,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Heartbeat failed'
    }, { status: 500 });
  }
}
