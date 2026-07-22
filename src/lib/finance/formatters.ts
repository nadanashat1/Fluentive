export function formatCurrency(
  value: number,
  options?: { maximumFractionDigits?: number; compact?: boolean }
): string {
  const { maximumFractionDigits = 0, compact = false } = options ?? {};
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCurrencyWithCode(
  value: number,
  currencyCode = "USD",
  precision = 2
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatRelativeDays(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

/** Map API status to UI label */
export function mapInvoiceStatus(status: string): string {
  switch (status) {
    case "SENT":
      return "Pending";
    case "CANCELLED":
      return "Failed";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export function isInvoiceOverdue(invoice: {
  status: string;
  dueDate: string;
}): boolean {
  if (invoice.status === "OVERDUE") return true;
  if (invoice.status === "PAID" || invoice.status === "CANCELLED" || invoice.status === "DRAFT")
    return false;
  return new Date(invoice.dueDate) < new Date();
}
