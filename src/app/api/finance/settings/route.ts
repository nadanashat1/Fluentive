import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { logFinanceActivity } from "@/lib/finance/activity";
import { mapFinanceSettings, getOrCreateFinanceSettings } from "@/lib/finance/settings";
import { financeSettingsPatchSchema } from "@/lib/finance/validation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function serializeSettings(row: Awaited<ReturnType<typeof getOrCreateFinanceSettings>>) {
  const mapped = mapFinanceSettings(row);
  return {
    ...mapped,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: "No organization context" }, { status: 400 });
    }

    const settings = await getOrCreateFinanceSettings(orgId);
    return NextResponse.json({ success: true, data: serializeSettings(settings) });
  } catch (err) {
    console.error("[Finance Settings API] GET failed:", err);
    return NextResponse.json({ success: false, error: "Failed to load finance settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: "No organization context" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = financeSettingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const patch = parsed.data;
    if (patch.taxMode === "NO_TAX") {
      patch.taxEnabled = false;
    }
    if (patch.taxEnabled === false && patch.taxMode === undefined) {
      patch.taxMode = "NO_TAX";
    }

    await getOrCreateFinanceSettings(orgId);
    const updated = await prisma.financeSettings.update({
      where: { organizationId: orgId },
      data: {
        ...(patch.taxEnabled !== undefined ? { taxEnabled: patch.taxEnabled } : {}),
        ...(patch.defaultTaxRate !== undefined ? { defaultTaxRate: patch.defaultTaxRate } : {}),
        ...(patch.taxMode !== undefined ? { taxMode: patch.taxMode } : {}),
        ...(patch.taxType !== undefined ? { taxType: patch.taxType } : {}),
        ...(patch.allowOverridePerInvoice !== undefined
          ? { allowOverridePerInvoice: patch.allowOverridePerInvoice }
          : {}),
        ...(patch.allowOverridePerItem !== undefined
          ? { allowOverridePerItem: patch.allowOverridePerItem }
          : {}),
        ...(patch.currencyCode !== undefined ? { currencyCode: patch.currencyCode } : {}),
        ...(patch.decimalPrecision !== undefined ? { decimalPrecision: patch.decimalPrecision } : {}),
        ...(patch.taxProfiles !== undefined ? { taxProfiles: patch.taxProfiles } : {}),
      },
    });

    await logFinanceActivity({
      userId: user.id,
      organizationId: orgId,
      action: "finance_settings_updated",
      entityType: "FINANCE",
      entityId: updated.id,
      details: `Tax settings updated (${updated.taxMode}, rate ${updated.defaultTaxRate}%)`,
    });

    return NextResponse.json({ success: true, data: serializeSettings(updated) });
  } catch (err) {
    console.error("[Finance Settings API] PATCH failed:", err);
    return NextResponse.json({ success: false, error: "Failed to update finance settings" }, { status: 500 });
  }
}
