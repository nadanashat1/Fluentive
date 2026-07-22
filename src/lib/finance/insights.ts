import type { FinanceAnalytics, FinanceInsight, FinanceInvoice } from "./types";
import { formatCurrency, formatPercent, isInvoiceOverdue } from "./formatters";

export function buildFinanceInsights(
  analytics: FinanceAnalytics,
  invoices: FinanceInvoice[]
): FinanceInsight[] {
  const insights: FinanceInsight[] = [];
  const overdue = invoices.filter((i) => isInvoiceOverdue(i));
  const growth = analytics.revenueGrowthPercent ?? 0;

  if (overdue.length > 0) {
    const overdueTotal = overdue.reduce((s, i) => s + i.total, 0);
    insights.push({
      id: "overdue",
      type: "danger",
      title: `${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}`,
      message: `${formatCurrency(overdueTotal)} is past due. Prioritize follow-ups to protect cash flow.`,
    });
  }

  if (growth !== 0) {
    insights.push({
      id: "revenue-change",
      type: growth >= 0 ? "success" : "warning",
      title: `Revenue ${growth >= 0 ? "up" : "down"} ${formatPercent(Math.abs(growth), 1)}`,
      message:
        growth >= 0
          ? "Revenue is trending positively compared to the previous period."
          : "Revenue dipped versus last period. Review pipeline and collections.",
    });
  }

  if (analytics.profit < 0 || analytics.expenses > analytics.revenue * 0.85) {
    insights.push({
      id: "cash-warning",
      type: "warning",
      title: "Cash flow pressure",
      message: `Expenses are ${formatPercent((analytics.expenses / Math.max(analytics.revenue, 1)) * 100, 0)} of revenue. Consider cost controls.`,
    });
  } else if (analytics.profit > 0) {
    insights.push({
      id: "cash-healthy",
      type: "success",
      title: "Healthy cash position",
      message: `Net profit of ${formatCurrency(analytics.profit)} with ${formatPercent(analytics.profitMargin, 1)} margin.`,
    });
  }

  const top = analytics.topCustomers?.[0];
  if (top) {
    insights.push({
      id: "top-customer",
      type: "info",
      title: `Top customer: ${top.name}`,
      message: `${top.name} represents ${formatPercent(top.percent, 1)} of paid revenue.`,
    });
  } else {
    const paid = invoices.filter((i) => i.status === "PAID");
    if (paid.length > 0) {
      const byClient: Record<string, number> = {};
      paid.forEach((i) => {
        byClient[i.clientName] = (byClient[i.clientName] ?? 0) + i.total;
      });
      const sorted = Object.entries(byClient).sort((a, b) => b[1] - a[1]);
      if (sorted[0]) {
        const total = paid.reduce((s, i) => s + i.total, 0);
        const pct = (sorted[0][1] / total) * 100;
        insights.push({
          id: "top-customer",
          type: "info",
          title: `Top customer: ${sorted[0][0]}`,
          message: `${sorted[0][0]} represents ${formatPercent(pct, 1)} of paid revenue.`,
        });
      }
    }
  }

  const forecast = analytics.forecastedRevenue ?? analytics.revenue * 1.12;
  insights.push({
    id: "forecast",
    type: "info",
    title: "Projected revenue",
    message: `Based on current trends, projected revenue is ${formatCurrency(forecast)} next period.`,
  });

  if (analytics.outstandingInvoices > 0) {
    insights.push({
      id: "outstanding",
      type: "warning",
      title: "Outstanding receivables",
      message: `${formatCurrency(analytics.outstandingInvoices)} awaiting payment across open invoices.`,
    });
  }

  return insights.slice(0, 6);
}
