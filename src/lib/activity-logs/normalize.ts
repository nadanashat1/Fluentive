import type {
  ActivityEventCategory,
  ActivityLogMetadata,
  ActivitySeverity,
  EnrichedActivityLog,
} from "./types";
import { toActivityISOString } from "./format-time";

const META_PREFIX = "@@fluentive-meta:";

export function isHeartbeatActivity(
  action: string,
  details: string,
  description?: string | null
): boolean {
  const haystack = `${action} ${details} ${description ?? ""}`.toLowerCase();
  return (
    haystack.includes("heartbeat") ||
    haystack.includes("user heartbeat") ||
    /idle:\s*(true|false)/i.test(haystack)
  );
}

export function decodeEmbeddedMetadata(
  description: string | null | undefined
): { text: string; meta: ActivityLogMetadata } {
  if (!description) return { text: "", meta: {} };

  if (description.startsWith(META_PREFIX)) {
    const end = description.indexOf("\n");
    const jsonPart = end === -1 ? description.slice(META_PREFIX.length) : description.slice(META_PREFIX.length, end);
    const text = end === -1 ? "" : description.slice(end + 1);
    try {
      const meta = JSON.parse(jsonPart) as ActivityLogMetadata;
      return { text: text.trim(), meta: meta && typeof meta === "object" ? meta : {} };
    } catch {
      return { text: description, meta: {} };
    }
  }

  if (description.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(description) as Record<string, unknown>;
      if (parsed && typeof parsed === "object" && ("meta" in parsed || "text" in parsed)) {
        return {
          text: String(parsed.text ?? parsed.message ?? ""),
          meta: (parsed.meta as ActivityLogMetadata) ?? {},
        };
      }
    } catch {
      /* plain text */
    }
  }

  return { text: description, meta: {} };
}

export function encodeActivityDescription(
  text: string,
  meta?: ActivityLogMetadata
): string {
  if (!meta || Object.keys(meta).length === 0) return text;
  return `${META_PREFIX}${JSON.stringify(meta)}\n${text}`;
}

export function inferCategory(
  type: string,
  details: string,
  meta?: ActivityLogMetadata
): ActivityEventCategory {
  if (meta?.entityType) {
    const et = String(meta.entityType).toUpperCase();
    if (et in CATEGORY_FROM_ENTITY) return CATEGORY_FROM_ENTITY[et];
  }

  const combined = `${type} ${details}`.toUpperCase();

  if (/LOGIN|LOGOUT|AUTH|PASSWORD|2FA|SESSION|MFA/.test(combined)) return "AUTH";
  if (/SECURITY|BREACH|UNAUTHORIZED|FORBIDDEN|INTRUSION/.test(combined)) return "SECURITY";
  if (/EXPORT|DOWNLOAD.*CSV|DOWNLOAD.*REPORT/.test(combined)) return "EXPORT";
  if (/IMPORT|UPLOAD.*CSV|BULK.*UPLOAD/.test(combined)) return "IMPORT";
  if (/OPENAI|AI |GPT|LLM|COPILOT|GENERAT/.test(combined)) return "AI";
  if (/LEAD|PROSPECT/.test(combined) || type.includes("LEAD")) return "LEAD";
  if (/DEAL|PIPELINE|STAGE|WON|LOST/.test(combined) || /DEAL_/.test(type)) return "DEAL";
  if (/INVOICE|PAYMENT|FINANCE|EXPENSE|REFUND|TAX|BILLING/.test(combined)) return "SYSTEM";
  if (/USER|PROFILE|ORGANIZATION|ORG_SWITCH|TEAM/.test(combined)) return "USER";
  if (type === "PAGE_VIEW") return "USER";

  return "SYSTEM";
}

const CATEGORY_FROM_ENTITY: Record<string, ActivityEventCategory> = {
  LEAD: "LEAD",
  DEAL: "DEAL",
  USER: "USER",
  AUTH: "AUTH",
  SECURITY: "SECURITY",
  AI: "AI",
  SYSTEM: "SYSTEM",
  INVOICE: "SYSTEM",
  PAYMENT: "SYSTEM",
  FINANCE: "SYSTEM",
};

export function inferSeverity(
  type: string,
  details: string,
  meta?: ActivityLogMetadata
): ActivitySeverity {
  if (meta?.severity && isSeverity(meta.severity)) {
    return meta.severity;
  }

  const combined = `${type} ${details}`.toLowerCase();

  if (/critical|breach|compromised|data.?loss/.test(combined)) return "critical";
  if (/failed|failure|error|timeout|denied|unauthorized|forbidden|invalid/.test(combined)) {
    return /login|auth/.test(combined) ? "warning" : "error";
  }
  if (/warn|suspicious|unusual|rate.?limit|deprecated/.test(combined)) return "warning";

  return "info";
}

function isSeverity(v: unknown): v is ActivitySeverity {
  return v === "info" || v === "warning" || v === "error" || v === "critical";
}

export function buildReadableLabel(
  action: string,
  details: string,
  category: ActivityEventCategory
): string {
  const cleanDetails = details.replace(/^\[[^\]]+\]\s*/, "").trim();
  if (cleanDetails && cleanDetails.length < 80) {
    return cleanDetails;
  }
  const actionLabel = action.replace(/_/g, " ").toLowerCase();
  return `${category} · ${actionLabel}`;
}

export function enrichActivityRecord(
  raw: Record<string, unknown>,
  requestMeta?: { ipAddress?: string; userAgent?: string }
): EnrichedActivityLog {
  const type = String(raw.type ?? raw.action ?? "SYSTEM");
  const rawDescription = raw.description != null ? String(raw.description) : null;
  const mappedDetails = raw.details != null ? String(raw.details) : null;
  const { text: decodedText, meta: embeddedMeta } = decodeEmbeddedMetadata(
    rawDescription ?? mappedDetails
  );

  const details =
    decodedText ||
    mappedDetails ||
    rawDescription ||
    "System action";

  const action = String(raw.action ?? type);
  const createdAt =
    toActivityISOString(raw.createdAt) ??
    toActivityISOString(raw.timestamp) ??
    new Date().toISOString();

  const userRaw = raw.user as Record<string, unknown> | undefined;
  const user = {
    id: userRaw?.id ? String(userRaw.id) : undefined,
    name: userRaw?.name ? String(userRaw.name) : "System",
    email: userRaw?.email ? String(userRaw.email) : undefined,
  };

  const metadata: ActivityLogMetadata = {
    ...embeddedMeta,
    organizationId:
      embeddedMeta.organizationId ??
      (raw.organizationId ? String(raw.organizationId) : undefined),
    ipAddress:
      embeddedMeta.ipAddress ??
      (raw.ipAddress ? String(raw.ipAddress) : requestMeta?.ipAddress),
    userAgent:
      embeddedMeta.userAgent ??
      (raw.userAgent ? String(raw.userAgent) : requestMeta?.userAgent),
    entityId:
      embeddedMeta.entityId ??
      (raw.leadId ? String(raw.leadId) : raw.dealId ? String(raw.dealId) : undefined),
    entityType: embeddedMeta.entityType ?? (raw.leadId ? "LEAD" : raw.dealId ? "DEAL" : undefined),
    requestId:
      typeof embeddedMeta.requestId === "string"
        ? embeddedMeta.requestId
        : typeof embeddedMeta.traceId === "string"
          ? embeddedMeta.traceId
          : undefined,
  };

  const category =
    (embeddedMeta.category as ActivityEventCategory | undefined) ??
    inferCategory(type, details, metadata);
  const severity = inferSeverity(type, details, metadata);
  const isHeartbeat = isHeartbeatActivity(action, details, rawDescription);
  const durationMs =
    typeof metadata.durationMs === "number" ? metadata.durationMs : undefined;

  return {
    id: String(raw.id),
    action,
    details,
    label: buildReadableLabel(action, details, category),
    category,
    severity,
    createdAt,
    timestamp: createdAt,
    ipAddress: metadata.ipAddress ?? "—",
    userAgent: metadata.userAgent ?? "—",
    user,
    lead: raw.lead as EnrichedActivityLog["lead"],
    deal: raw.deal as EnrichedActivityLog["deal"],
    organizationId: raw.organizationId ? String(raw.organizationId) : null,
    metadata,
    isLowPriority: isHeartbeat || type === "PAGE_VIEW",
    isHeartbeat,
    isSuspicious:
      severity === "critical" ||
      /suspicious|brute|anomaly|impossible.?travel/i.test(details),
    isSlowRequest: typeof durationMs === "number" && durationMs >= 3000,
  };
}
