import type { FinanceInvoice, TimelineEvent } from "./types";
import { formatCurrency } from "./formatters";

export function buildTransactionTimeline(invoices: FinanceInvoice[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  invoices.forEach((inv) => {
    if (inv.status === "PAID" && inv.paidDate) {
      events.push({
        id: `pay-${inv.id}`,
        type: "payment",
        title: `Payment received — ${inv.number}`,
        description: `${inv.clientName} paid ${formatCurrency(inv.total)}`,
        amount: inv.total,
        status: "PAID",
        timestamp: inv.paidDate,
        clientName: inv.clientName,
      });
    }

    events.push({
      id: `inv-${inv.id}`,
      type: "invoice",
      title: `Invoice ${inv.number} issued`,
      description: `${formatCurrency(inv.total)} to ${inv.clientName}`,
      amount: inv.total,
      status: inv.status,
      timestamp: inv.issueDate,
      clientName: inv.clientName,
    });

    if (inv.status === "OVERDUE") {
      events.push({
        id: `overdue-${inv.id}`,
        type: "failed",
        title: `Overdue — ${inv.number}`,
        description: `Payment overdue for ${inv.clientName}`,
        amount: inv.total,
        status: "OVERDUE",
        timestamp: inv.dueDate,
        clientName: inv.clientName,
      });
    }

    if (inv.status === "CANCELLED") {
      events.push({
        id: `cancel-${inv.id}`,
        type: "refund",
        title: `Invoice cancelled — ${inv.number}`,
        description: `${inv.clientName} — ${formatCurrency(inv.total)}`,
        amount: inv.total,
        status: "CANCELLED",
        timestamp: inv.updatedAt ?? inv.issueDate,
        clientName: inv.clientName,
      });
    }

    if (inv.status === "SENT") {
      const due = new Date(inv.dueDate);
      const now = new Date();
      const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7 && daysUntil > 0) {
        events.push({
          id: `renewal-${inv.id}`,
          type: "renewal",
          title: `Payment due soon — ${inv.number}`,
          description: `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"} for ${inv.clientName}`,
          amount: inv.total,
          status: "SENT",
          timestamp: inv.dueDate,
          clientName: inv.clientName,
        });
      }
    }
  });

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 25);
}
