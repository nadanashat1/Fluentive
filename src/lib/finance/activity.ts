import { AuditService } from "@/lib/server/services/audit.service";

export async function logFinanceActivity(params: {
  userId: string;
  organizationId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string | Record<string, unknown>;
}) {
  try {
    await AuditService.log({
      userId: params.userId,
      organizationId: params.organizationId,
      action: params.action,
      entityType: params.entityType ?? "FINANCE",
      entityId: params.entityId,
      details: params.details,
    });
  } catch (err) {
    console.error("[Finance Activity] log failed:", err);
  }
}
