import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/middleware/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

const PREF_FIELDS = [
  'emailEnabled',
  'browserEnabled',
  'leadCreatedEnabled',
  'leadConvertedEnabled',
  'leadDeletedEnabled',
  'userRegisteredEnabled',
  'aiScoreEnabled',
  'fileUploadEnabled',
  'importantNoteEnabled',
  'churnRiskEnabled',
] as const;

type PrefField = typeof PREF_FIELDS[number];

const DEFAULTS: Record<PrefField, boolean> = {
  emailEnabled: true,
  browserEnabled: true,
  leadCreatedEnabled: true,
  leadConvertedEnabled: true,
  leadDeletedEnabled: false,
  userRegisteredEnabled: true,
  aiScoreEnabled: true,
  fileUploadEnabled: true,
  importantNoteEnabled: true,
  churnRiskEnabled: true,
};

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const stored = await prisma.notificationPreference.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...(stored ?? { id: null, ...DEFAULTS, userId: user.id }),
      }
    });
  } catch (error) {
    console.error('[Notification Preferences API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });
    }

    const body = await request.json();
    // Only accept known boolean preference fields; ignore anything else.
    const updates: Partial<Record<PrefField, boolean>> = {};
    for (const field of PREF_FIELDS) {
      if (typeof body?.[field] === 'boolean') {
        updates[field] = body[field];
      }
    }

    const saved = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        organizationId: user.organizationId,
        ...DEFAULTS,
        ...updates,
      },
      update: updates,
    });

    return NextResponse.json({
      success: true,
      data: saved
    });
  } catch (error) {
    console.error('[Notification Preferences API] PUT failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
  }
}
