import type { EnrichedActivityLog } from "./types";

export interface ActivityEntityLink {
  href: string;
  label: string;
}

/** Resolve in-app links for known entities (only when routes exist). */
export function getActivityEntityLink(log: EnrichedActivityLog): ActivityEntityLink | null {
  if (log.lead?.id) {
    return { href: `/leads/${log.lead.id}`, label: log.lead.name };
  }
  if (log.deal?.id) {
    return { href: `/sales-pipeline/${log.deal.id}`, label: log.deal.title };
  }

  const entityType = String(log.metadata?.entityType ?? "").toUpperCase();
  const entityId = log.metadata?.entityId;

  if (entityType === "INVOICE" && entityId) {
    return { href: `/finance?highlight=${entityId}`, label: "View invoice" };
  }
  if (entityType === "USER" && entityId) {
    return { href: `/users`, label: "Users" };
  }

  return null;
}
