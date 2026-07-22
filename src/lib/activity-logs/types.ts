export type ActivityEventCategory =
  | "AUTH"
  | "LEAD"
  | "DEAL"
  | "AI"
  | "SECURITY"
  | "USER"
  | "SYSTEM"
  | "EXPORT"
  | "IMPORT";

export type ActivitySeverity = "info" | "warning" | "error" | "critical";

export interface ActivityLogMetadata {
  browser?: string;
  device?: string;
  route?: string;
  requestId?: string;
  organizationId?: string;
  entityId?: string;
  entityType?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface EnrichedActivityLog {
  id: string;
  action: string;
  details: string;
  label: string;
  category: ActivityEventCategory;
  severity: ActivitySeverity;
  createdAt: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  user: { id?: string; name: string; email?: string };
  lead?: { id: string; name: string; status?: string };
  deal?: { id: string; title: string; stage?: string };
  organizationId?: string | null;
  metadata: ActivityLogMetadata;
  isLowPriority: boolean;
  isHeartbeat: boolean;
  isSuspicious: boolean;
  isSlowRequest: boolean;
  repeatCount?: number;
  groupedIds?: string[];
}

export interface ActivityLogsFilters {
  search?: string;
  page?: number;
  limit?: number;
  category?: ActivityEventCategory | "all";
  severity?: ActivitySeverity | "all";
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  ip?: string;
  organizationId?: string;
  errorsOnly?: boolean;
  includeNoise?: boolean;
}

export interface ActivityLogsResponse {
  success: true;
  data: EnrichedActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    hiddenHeartbeatCount: number;
    aggregatedGroupCount: number;
  };
}
