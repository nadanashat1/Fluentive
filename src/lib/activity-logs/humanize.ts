import { differenceInMinutes } from "date-fns";
import type { EnrichedActivityLog } from "./types";
import type { DisplayActivityItem } from "./aggregate";
import { CATEGORY_CONFIG } from "./event-config";
import { parseActivityTimestamp } from "./format-time";
import { getActivityImportance, type ActivityImportance } from "./importance";

export interface HumanizedActivity {
  headline: string;
  subline?: string;
  entityLine?: string;
  changeLine?: string;
  whyItMatters?: string;
  importance: ActivityImportance;
  categoryLabel: string;
}

function firstName(name: string): string {
  const n = name.trim();
  if (!n || n === "System") return "Someone";
  return n.split(/\s+/)[0];
}

function extractEntityName(log: EnrichedActivityLog): string | undefined {
  if (log.lead?.name) return log.lead.name;
  if (log.deal?.title) return log.deal.title;
  const dealMatch = log.details.match(/deal[:\s]+([^,.\n]+)/i);
  if (dealMatch) return dealMatch[1].trim();
  const leadMatch = log.details.match(/lead[:\s]+([^,.\n]+)/i);
  if (leadMatch) return leadMatch[1].trim();
  return undefined;
}

function parseBracketAction(details: string): { entity?: string; action?: string } | null {
  const m = details.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.*)$/);
  if (!m) return null;
  return { entity: m[1], action: m[2].trim(), };
}

function formatStatusChange(log: EnrichedActivityLog): string | undefined {
  const prev = log.metadata.previousValue;
  const next = log.metadata.newValue;
  if (prev && next) {
    return `Changed from ${prev} to ${next}`;
  }
  const arrow = log.details.match(/from\s+(.+?)\s+to\s+(.+)/i);
  if (arrow) return `Changed from ${arrow[1]} to ${arrow[2]}`;
  if (log.lead?.status) return `Lead is now ${log.lead.status}`;
  if (log.deal?.stage) return `Deal moved to ${log.deal.stage.replace(/_/g, " ")}`;
  return undefined;
}

function humanizeActionVerb(action: string, details: string): string {
  const a = action.replace(/_/g, " ").toLowerCase();
  const d = details.toLowerCase();

  if (/deal.*creat|creat.*deal/.test(d) || a.includes("deal") && /creat/.test(d)) return "created a new deal";
  if (/lead.*creat|creat.*lead/.test(d) || /creat/.test(d) && logCategoryIs(d, "lead")) return "created a new lead";
  if (/deal.*updat|updat.*deal/.test(d)) return "updated a deal";
  if (/lead.*updat|updat.*lead|status/.test(d)) return "updated a lead";
  if (/stage|pipeline/.test(d) || a.includes("stage")) return "moved a deal to a new stage";
  if (/won/.test(d) || a.includes("won")) return "marked a deal as won";
  if (/lost/.test(d) || a.includes("lost")) return "marked a deal as lost";
  if (/export/.test(d)) return "exported a report";
  if (/import/.test(d)) return "imported data";
  if (/login|signed in/.test(d)) return /fail/.test(d) ? "failed to sign in" : "signed in";
  if (/logout/.test(d)) return "signed out";
  if (/password/.test(d)) return "changed their password";
  if (/note/.test(d) || a.includes("note")) return "added a note";
  if (/meeting/.test(d)) return "scheduled a meeting";
  if (/call/.test(d)) return "logged a call";
  if (/email/.test(d)) return "sent an email";
  if (/ai|generat|analyz|summary/.test(d)) return "ran an AI workflow";
  if (/invoice.*creat|creat.*invoice|invoice_created/.test(d) || a.includes("invoice") && /creat/.test(d)) return "created an invoice";
  if (/invoice.*paid|marked paid|invoice_paid/.test(d)) return "marked an invoice as paid";
  if (/finance_settings|tax settings/.test(d)) return "updated finance and tax settings";
  if (/expense/.test(d) && /creat|added/.test(d)) return "recorded an expense";
  if (/refund/.test(d)) return "processed a refund";
  if (/payment/.test(d) && /added|recorded/.test(d)) return "recorded a payment";
  if (/page view|visited/.test(d)) return "viewed a page";
  if (/heartbeat/.test(d)) return "was active in the app";

  if (/creat/.test(a)) return "created something new";
  if (/updat/.test(a)) return "made an update";
  if (/delet/.test(a)) return "removed something";
  return a.replace(/system/g, "performed a system action");
}

function logCategoryIs(details: string, cat: string): boolean {
  return details.includes(cat);
}

export function humanizeActivity(log: EnrichedActivityLog): HumanizedActivity {
  const who = firstName(log.user.name);
  const entity = extractEntityName(log);
  const categoryLabel = CATEGORY_CONFIG[log.category].label;
  const importance = getActivityImportance(log);
  const changeLine = formatStatusChange(log);

  if (log.isHeartbeat) {
    return {
      headline: `${who} was active in the app`,
      subline: "Routine presence check — low priority",
      importance: "low",
      categoryLabel: "System Health",
    };
  }

  const bracket = parseBracketAction(log.details);
  const verb = humanizeActionVerb(log.action, log.details);
  let headline = "";
  let subline: string | undefined;
  let entityLine: string | undefined;
  let whyItMatters: string | undefined;

  if (log.category === "AUTH") {
    if (/fail|denied|invalid/i.test(log.details)) {
      headline = `${who} failed to sign in`;
      subline = "Check if this was expected or a possible security concern";
      whyItMatters = "Multiple failed sign-ins can indicate someone trying to access an account.";
    } else if (/new device|unfamiliar/i.test(log.details)) {
      headline = `${who} signed in from a new device`;
      whyItMatters = "New devices are worth confirming with the team member.";
    } else {
      headline = `${who} signed in successfully`;
    }
  } else if (log.category === "AI") {
    const countMatch = log.details.match(/(\d+)\s*lead/i);
    if (/fail|error|timeout/i.test(log.details)) {
      headline = `AI task failed for ${who}`;
      subline = log.details.length < 120 ? log.details : "The AI workflow did not complete successfully";
      whyItMatters = "AI errors may delay lead scoring, summaries, or outreach suggestions.";
    } else if (countMatch) {
      headline = `AI successfully analyzed ${countMatch[1]} leads`;
      subline = `Triggered by ${who}`;
    } else if (/summary|generat/i.test(log.details)) {
      headline = `${who} generated an AI summary`;
      subline = entity ? `Related to ${entity}` : undefined;
    } else {
      headline = `${who} used AI assistance`;
      subline = log.details.replace(/^\[[^\]]+\]\s*/, "").slice(0, 100);
    }
  } else if (log.category === "EXPORT") {
    const formatMatch = log.details.match(/excel|csv|pdf|report/i);
    headline = `${who} exported a CRM report`;
    subline = formatMatch ? `Format: ${formatMatch[0].toUpperCase()}` : "Data left the system for download";
    whyItMatters = "Exports should be reviewed for sensitive customer data.";
  } else if (log.category === "IMPORT") {
    const countMatch = log.details.match(/(\d+)\s*contact/i);
    headline = countMatch
      ? `${who} imported ${countMatch[1]} contacts`
      : `${who} imported new contacts`;
    subline = "New records were added to the CRM";
  } else if (log.category === "DEAL") {
    if (log.action.includes("WON") || /won/.test(log.details)) {
      headline = entity ? `${who} won the deal “${entity}”` : `${who} closed a deal as won`;
    } else if (log.action.includes("LOST") || /lost/.test(log.details)) {
      headline = entity ? `${who} marked “${entity}” as lost` : `${who} marked a deal as lost`;
    } else if (log.action.includes("STAGE") || changeLine) {
      headline = entity
        ? `${who} moved “${entity}” to a new stage`
        : `${who} updated deal pipeline stage`;
      subline = changeLine;
    } else if (/creat/.test(log.details) || /creat/.test(log.action)) {
      headline = entity
        ? `${who} created a new deal: ${entity}`
        : `${who} created a new deal`;
    } else {
      headline = entity ? `${who} updated deal “${entity}”` : `${who} updated a deal`;
      subline = log.details.replace(/^Deal:\s*/i, "").slice(0, 90) || undefined;
    }
  } else if (log.category === "LEAD") {
    if (changeLine) {
      headline = entity
        ? `${who} updated lead “${entity}”`
        : `${who} updated a lead status`;
      subline = changeLine;
    } else if (/creat/.test(log.details)) {
      headline = entity
        ? `${who} created a new lead: ${entity}`
        : `${who} created a new lead`;
    } else {
      headline = entity ? `${who} worked on lead “${entity}”` : `${who} updated a lead`;
      subline = log.details.replace(/^\[[^\]]+\]\s*/, "").slice(0, 90) || undefined;
    }
  } else if (
    /invoice|payment|finance|expense|refund|tax|billing/i.test(
      `${log.action} ${log.details} ${log.metadata?.entityType ?? ""}`
    )
  ) {
    const invoiceRef =
      log.metadata?.entityType === "INVOICE" && log.metadata?.entityId
        ? `invoice #${String(log.metadata.entityId).slice(0, 8)}`
        : entity;
    if (/creat/.test(log.details) || /invoice_created/i.test(log.action)) {
      headline = invoiceRef
        ? `${who} created ${invoiceRef}`
        : `${who} created an invoice`;
      whyItMatters = "New invoices affect revenue recognition and customer billing.";
    } else if (/paid|payment recorded|marked paid/i.test(log.details)) {
      headline = invoiceRef
        ? `${who} recorded a payment on ${invoiceRef}`
        : `${who} recorded a payment`;
      whyItMatters = "Payments update cash flow and outstanding balances.";
    } else if (/overdue|past due/i.test(log.details)) {
      headline = invoiceRef
        ? `${who} flagged ${invoiceRef} as overdue`
        : `${who} updated overdue invoice status`;
    } else if (/tax|finance_settings/i.test(log.details)) {
      headline = `${who} updated finance or tax settings`;
      subline = "Manual tax rules and defaults were changed";
    } else if (/expense/.test(log.details)) {
      headline = `${who} recorded an expense`;
    } else if (/refund/.test(log.details)) {
      headline = `${who} processed a refund`;
    } else {
      headline = invoiceRef
        ? `${who} updated finance record ${invoiceRef}`
        : `${who} updated a finance record`;
      subline = log.details.replace(/^\[[^\]]+\]\s*/, "").slice(0, 100) || undefined;
    }
  } else if (log.category === "SECURITY") {
    headline = `${who} triggered a security event`;
    subline = log.details.slice(0, 100);
    whyItMatters = "Security events may need review by an administrator.";
  } else if (bracket) {
    headline = `${who} ${verb}${entity ? `: ${entity}` : ""}`;
    subline = bracket.action;
  } else {
    headline = `${who} ${verb}`;
    if (entity) headline += `: ${entity}`;
    subline =
      log.details !== headline && log.details.length < 120
        ? log.details.replace(/^\[[^\]]+\]\s*/, "")
        : undefined;
  }

  if (log.isSlowRequest) {
    whyItMatters = whyItMatters ?? "This action took longer than usual — performance may need attention.";
  }
  if (log.isSuspicious && !whyItMatters) {
    whyItMatters = "This activity looks unusual and may deserve a closer look.";
  }
  if (log.severity === "critical") {
    whyItMatters = whyItMatters ?? "Critical events should be reviewed promptly.";
  }

  entityLine = buildEntityLine(log);

  return {
    headline,
    subline,
    entityLine,
    changeLine,
    whyItMatters,
    importance,
    categoryLabel,
  };
}

function buildEntityLine(log: EnrichedActivityLog): string | undefined {
  const parts: string[] = [];
  if (log.lead?.name) parts.push(`Lead: ${log.lead.name}`);
  if (log.deal?.title) parts.push(`Deal: ${log.deal.title}`);
  if (log.organizationId) parts.push(`Organization`);
  if (parts.length) return parts.join(" · ");
  return undefined;
}

export function humanizeGroupSummary(item: DisplayActivityItem): HumanizedActivity {
  const base = humanizeActivity(item.log);
  const who = firstName(item.log.user.name);
  const start = parseActivityTimestamp(item.earliestAt);
  const end = parseActivityTimestamp(item.latestAt);
  let windowLabel = "a short period";
  if (start && end) {
    const mins = differenceInMinutes(end, start);
    if (mins < 1) windowLabel = "under a minute";
    else if (mins < 60) windowLabel = `${mins} minute${mins === 1 ? "" : "s"}`;
    else windowLabel = `${Math.round(mins / 60)} hour${mins >= 120 ? "s" : ""}`;
  }

  if (item.kind === "heartbeat-group") {
    return {
      headline: `Repeated heartbeat activity hidden (${item.count} events)`,
      subline: `${who} stayed online — routine background activity`,
      importance: "low",
      categoryLabel: "System Health",
      whyItMatters: undefined,
    };
  }

  if (item.kind === "repeat-group") {
    const entity = extractEntityName(item.log);
    let headline = `${who} performed the same action ${item.count} times within ${windowLabel}`;

    if (item.log.category === "DEAL" && /creat/i.test(item.log.details)) {
      headline = `${who} created ${item.count} deals within ${windowLabel}`;
    } else if (item.log.category === "LEAD" && /creat/i.test(item.log.details)) {
      headline = `${who} created ${item.count} leads within ${windowLabel}`;
    } else if (entity) {
      headline = `${who} repeated “${entity}” updates ${item.count} times within ${windowLabel}`;
    }

    return {
      ...base,
      headline,
      subline: `Grouped to reduce noise — expand for technical details`,
      importance: base.importance === "low" ? "normal" : base.importance,
    };
  }

  return base;
}
