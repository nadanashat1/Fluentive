import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/auth';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import {
  enrichActivityRecord,
  encodeActivityDescription,
} from '@/lib/activity-logs/normalize';
import type {
  ActivityEventCategory,
  ActivitySeverity,
  EnrichedActivityLog,
} from '@/lib/activity-logs/types';

function requestMeta(request: Request) {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}

export const GET = withRateLimit(
  withMemoryCheck(async (request: Request | NextRequest) => {
    try {
      const { user, error } = await requireAuth(request as NextRequest);
      if (error || !user) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
      const skip = (page - 1) * limit;
      const search = searchParams.get('search')?.trim();
      const category = searchParams.get('category');
      const severity = searchParams.get('severity');
      const userId = searchParams.get('userId');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const ip = searchParams.get('ip');
      const organizationId = searchParams.get('organizationId');
      const errorsOnly = searchParams.get('errorsOnly') === 'true';
      const includeNoise = searchParams.get('includeNoise') === 'true';

      const where: Record<string, unknown> = { isDeleted: false };

      if (user.role !== 'admin' && user.role !== 'super_admin') {
        where.userId = user.id;
      } else if (userId) {
        where.userId = userId;
      }

      // Tenant isolation: default to the caller's org unless super_admin explicitly scopes another.
      if (user.role === 'super_admin' && organizationId) {
        where.organizationId = organizationId;
      } else if (user.organizationId) {
        where.organizationId = user.organizationId;
      }

      if (dateFrom || dateTo) {
        const createdAt: Record<string, Date> = {};
        if (dateFrom) {
          const from = new Date(dateFrom);
          if (!Number.isNaN(from.getTime())) createdAt.gte = from;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          if (!Number.isNaN(to.getTime())) {
            to.setHours(23, 59, 59, 999);
            createdAt.lte = to;
          }
        }
        if (Object.keys(createdAt).length) where.createdAt = createdAt;
      }

      const andFilters: Record<string, unknown>[] = [];

      if (search) {
        andFilters.push({
          OR: [
            { type: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { lead: { name: { contains: search, mode: 'insensitive' } } },
            { deal: { title: { contains: search, mode: 'insensitive' } } },
          ],
        });
      }

      if (andFilters.length) {
        where.AND = andFilters;
      }

      const reqMeta = requestMeta(request);

      const [activities, totalRaw] = await withTimeout(
        Promise.all([
          (prisma as any).activity.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true } },
              lead: { select: { id: true, name: true, status: true } },
              deal: { select: { id: true, title: true, stage: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit * 3, 300),
            skip,
          }),
          (prisma as any).activity.count({ where }),
        ]),
        15000
      );

      let enriched: EnrichedActivityLog[] = activities.map((a: Record<string, unknown>) =>
        enrichActivityRecord(
          {
            ...a,
            action: a.type,
            details: a.description || 'System Action',
          },
          reqMeta
        )
      );

      let hiddenHeartbeatCount = 0;

      if (!includeNoise) {
        const before = enriched.length;
        enriched = enriched.filter((log) => !log.isHeartbeat);
        hiddenHeartbeatCount = before - enriched.length;
      }

      if (category && category !== 'all') {
        enriched = enriched.filter((log) => log.category === category);
      }

      if (severity && severity !== 'all') {
        enriched = enriched.filter((log) => log.severity === severity);
      }

      if (errorsOnly) {
        enriched = enriched.filter(
          (log) => log.severity === 'error' || log.severity === 'critical'
        );
      }

      if (ip) {
        const ipNeedle = ip.toLowerCase();
        enriched = enriched.filter((log) =>
          (log.ipAddress || '').toLowerCase().includes(ipNeedle)
        );
      }

      const paginated = enriched.slice(0, limit);
      const total = includeNoise ? totalRaw : Math.max(totalRaw - hiddenHeartbeatCount, paginated.length);

      const responseData = {
        success: true,
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        meta: {
          hiddenHeartbeatCount,
          aggregatedGroupCount: 0,
        },
      };

      return createCompressedResponse(responseData, 200, {
        'X-Total-Count': String(total),
        'X-Page-Count': String(Math.ceil(total / limit) || 1),
      });
    } catch (error) {
      console.error('Activity logs fetch error:', error);
      return createCompressedResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch activity logs',
        },
        500
      );
    }
  }),
  { endpoint: 'activity-logs' }
);

export const POST = withRateLimit(
  withMemoryCheck(async (request: Request) => {
    try {
      const { user, error } = await requireAuth(request as NextRequest);
      if (error || !user) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
      }

      const body = await request.json();
      const {
        type,
        description,
        leadId,
        dealId,
        metadata,
        severity,
        category,
      } = body as {
        type: string;
        description?: string;
        leadId?: string;
        dealId?: string;
        metadata?: Record<string, unknown>;
        severity?: ActivitySeverity;
        category?: ActivityEventCategory;
      };

      if (!type) {
        return createCompressedResponse({ success: false, error: 'Activity type is required' }, 400);
      }

      const metaPayload = {
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
        ...(severity ? { severity } : {}),
        ...(category ? { category } : {}),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined,
      };

      const storedDescription = encodeActivityDescription(
        description || '',
        Object.keys(metaPayload).length ? metaPayload : undefined
      );

      const activity = (await withTimeout(
        (prisma as any).activity.create({
          data: {
            type,
            description: storedDescription || null,
            userId: user.id,
            leadId: leadId || null,
            dealId: dealId || null,
            organizationId: (user as { organizationId?: string }).organizationId ?? null,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            lead: { select: { id: true, name: true, status: true } },
            deal: { select: { id: true, title: true, stage: true } },
          },
        }),
        10000
      )) as Record<string, unknown>;

      const enriched = enrichActivityRecord(
        {
          ...activity,
          action: String(activity.type ?? type),
          details: description || 'System Action',
        },
        requestMeta(request)
      );

      return createCompressedResponse(
        {
          success: true,
          data: enriched,
          message: 'Activity logged successfully',
        },
        201
      );
    } catch (error) {
      console.error('Activity creation error:', error);
      return createCompressedResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create activity',
        },
        500
      );
    }
  }),
  { endpoint: 'activity-logs' }
);
