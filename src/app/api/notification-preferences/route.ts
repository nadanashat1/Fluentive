import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/middleware/auth";

export const runtime = 'nodejs';

let defaultPreferences = {
  id: "pref-1",
  userId: "usr-1",
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

    return NextResponse.json({
      success: true,
      data: {
        ...defaultPreferences,
        userId: user.id
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

    const updates = await request.json();
    defaultPreferences = { ...defaultPreferences, ...updates, userId: user.id };

    return NextResponse.json({
      success: true,
      data: defaultPreferences
    });
  } catch (error) {
    console.error('[Notification Preferences API] PUT failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
  }
}
