import type {
  FinanceAnalytics,
  FinanceInvoice,
  FinanceMetric,
  OperationalMetrics,
} from "./types";
import { formatCurrency, formatPercent } from "./formatters";

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function sparklineFromMonthly(monthlyData: { revenue: number; expenses: number }[], key: "revenue" | "expenses"): number[] {
  return monthlyData.slice(-6).map((m) => m[key]);
}

export function buildFinanceMetrics(
  analytics: FinanceAnalytics,
  invoices: FinanceInvoice[]
): FinanceMetric[] {
  const paidTotal =
    analytics.paidInvoicesTotal ??
    invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const monthlyRevenue =
    analytics.monthlyRevenue ??
    (analytics.monthlyData.length
      ? analytics.monthlyData[analytics.monthlyData.length - 1]?.revenue ?? 0
      : analytics.revenue);
  const growth = analytics.revenueGrowthPercent ?? percentChange(analytics.revenue, analytics.previousRevenue ?? analytics.revenue * 0.88);
  const cashFlow = analytics.cashFlow ?? analytics.profit;
  const avgDeal =
    analytics.avgDealValue ??
    (invoices.length ? invoices.reduce((s, i) => s + i.total, 0) / invoices.length : 0);
  const forecast = analytics.forecastedRevenue ?? analytics.revenue * 1.12;
  const subscription = analytics.subscriptionRevenue ?? analytics.revenue * 0.35;
  const refunds = analytics.refundsLosses ?? analytics.expenses * 0.05;
  const revSpark = sparklineFromMonthly(analytics.monthlyData, "revenue");
  const expSpark = sparklineFromMonthly(analytics.monthlyData, "expenses");

  return [
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: formatCurrency(analytics.revenue),
      rawValue: analytics.revenue,
      trendPercent: growth,
      trendLabel: "vs prior period",
      trendPositive: growth >= 0,
      sparkline: revSpark,
      format: "currency",
    },
    {
      id: "monthly-revenue",
      title: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      rawValue: monthlyRevenue,
      trendPercent: growth,
      trendLabel: "current period",
      trendPositive: growth >= 0,
      sparkline: revSpark,
      format: "currency",
    },
    {
      id: "outstanding",
      title: "Outstanding Invoices",
      value: formatCurrency(analytics.outstandingInvoices),
      rawValue: analytics.outstandingInvoices,
      trendLabel: "requires follow-up",
      trendPositive: analytics.outstandingInvoices === 0,
      format: "currency",
    },
    {
      id: "paid-invoices",
      title: "Paid Invoices",
      value: formatCurrency(paidTotal),
      rawValue: paidTotal,
      trendPositive: true,
      trendLabel: `${invoices.filter((i) => i.status === "PAID").length} paid`,
      format: "currency",
    },
    {
      id: "profit-margin",
      title: "Profit Margin",
      value: formatPercent(analytics.profitMargin, 1),
      rawValue: analytics.profitMargin,
      trendPositive: analytics.profitMargin > 0,
      trendLabel: "net margin",
      format: "percent",
    },
    {
      id: "expenses",
      title: "Expenses",
      value: formatCurrency(analytics.expenses),
      rawValue: analytics.expenses,
      trendPositive: false,
      sparkline: expSpark,
      format: "currency",
    },
    {
      id: "cash-flow",
      title: "Cash Flow",
      value: formatCurrency(cashFlow),
      rawValue: cashFlow,
      trendPositive: cashFlow >= 0,
      trendLabel: "net position",
      format: "currency",
    },
    {
      id: "revenue-growth",
      title: "Revenue Growth",
      value: formatPercent(growth, 1),
      rawValue: growth,
      trendPercent: growth,
      trendPositive: growth >= 0,
      format: "percent",
    },
    {
      id: "avg-deal",
      title: "Avg Deal Value",
      value: formatCurrency(avgDeal),
      rawValue: avgDeal,
      trendPositive: true,
      format: "currency",
    },
    {
      id: "forecast",
      title: "Forecasted Revenue",
      value: formatCurrency(forecast),
      rawValue: forecast,
      trendPositive: true,
      trendLabel: "projected",
      format: "currency",
    },
    {
      id: "subscription",
      title: "Subscription Revenue",
      value: formatCurrency(subscription),
      rawValue: subscription,
      trendPositive: true,
      format: "currency",
    },
    {
      id: "refunds",
      title: "Refunds / Losses",
      value: formatCurrency(refunds),
      rawValue: refunds,
      trendPositive: refunds === 0,
      trendLabel: "write-offs",
      format: "currency",
    },
  ];
}

export function buildOperationalMetrics(
  analytics: FinanceAnalytics,
  invoices: FinanceInvoice[]
): OperationalMetrics {
  const paid = invoices.filter((i) => i.status === "PAID");
  const sent = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE");
  const mrr = analytics.mrr ?? analytics.revenue / 12;
  const arr = analytics.arr ?? mrr * 12;

  const customerTotals: Record<string, number> = {};
  paid.forEach((inv) => {
    customerTotals[inv.clientName] = (customerTotals[inv.clientName] ?? 0) + inv.total;
  });
  const topPayingCustomers = Object.entries(customerTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const conversionRate =
    invoices.length > 0 ? (paid.length / invoices.length) * 100 : 0;

  let delaySum = 0;
  let delayCount = 0;
  paid.forEach((inv) => {
    if (inv.paidDate) {
      const days =
        (new Date(inv.paidDate).getTime() - new Date(inv.issueDate).getTime()) /
        (1000 * 60 * 60 * 24);
      if (days >= 0) {
        delaySum += days;
        delayCount++;
      }
    }
  });
  const avgPaymentDelayDays = delayCount > 0 ? delaySum / delayCount : 0;

  const unpaidRevenue = sent.reduce((s, i) => s + i.total, 0);
  const marginScore = Math.min(100, Math.max(0, analytics.profitMargin));
  const collectionScore =
    analytics.outstandingInvoices === 0
      ? 100
      : Math.max(0, 100 - (analytics.outstandingInvoices / Math.max(analytics.revenue, 1)) * 50);
  const growthScore = Math.min(100, Math.max(0, 50 + (analytics.revenueGrowthPercent ?? 5)));
  const financialHealthScore = Math.round(
    marginScore * 0.4 + collectionScore * 0.35 + growthScore * 0.25
  );

  const churnImpact = sent.length > 0 ? (sent.length / Math.max(invoices.length, 1)) * 15 : 2;

  return {
    mrr,
    arr,
    churnImpact,
    topPayingCustomers,
    invoiceConversionRate: conversionRate,
    avgPaymentDelayDays,
    unpaidRevenue,
    financialHealthScore,
  };
}

export function enrichMonthlyData(analytics: FinanceAnalytics) {
  return analytics.monthlyData.map((m) => ({
    ...m,
    profit: m.revenue - m.expenses,
    cashFlow: m.revenue - m.expenses,
  }));
}

export function buildForecastChartData(analytics: FinanceAnalytics) {
  if (analytics.forecastData?.length) return analytics.forecastData;
  const data = analytics.monthlyData;
  if (data.length === 0) return [];
  const last = data[data.length - 1];
  const avgGrowth = 1.08;
  return [
    ...data.map((d) => ({ name: d.name, actual: d.revenue, forecast: 0 })),
    {
      name: "Forecast",
      actual: 0,
      forecast: Math.round(last.revenue * avgGrowth),
    },
  ];
}

export function buildRevenueBySource(analytics: FinanceAnalytics) {
  if (analytics.revenueBySource?.length) return analytics.revenueBySource;
  const total = analytics.revenue || 1;
  return [
    { name: "Invoices", value: Math.round(total * 0.55) },
    { name: "Deals", value: Math.round(total * 0.3) },
    { name: "Subscriptions", value: Math.round(total * 0.12) },
    { name: "Other", value: Math.round(total * 0.03) },
  ];
}

export function buildPaymentTrends(analytics: FinanceAnalytics, invoices: FinanceInvoice[]) {
  if (analytics.paymentTrends?.length) return analytics.paymentTrends;
  const byMonth: Record<string, { paid: number; pending: number; overdue: number }> = {};
  invoices.forEach((inv) => {
    const month = new Date(inv.issueDate).toLocaleString("default", { month: "short" });
    if (!byMonth[month]) byMonth[month] = { paid: 0, pending: 0, overdue: 0 };
    if (inv.status === "PAID") byMonth[month].paid += inv.total;
    else if (inv.status === "OVERDUE") byMonth[month].overdue += inv.total;
    else if (inv.status === "SENT") byMonth[month].pending += inv.total;
  });
  const entries = Object.entries(byMonth);
  if (entries.length === 0) {
    return analytics.monthlyData.map((m) => ({
      name: m.name,
      paid: m.revenue,
      pending: Math.round(m.revenue * 0.2),
      overdue: Math.round(m.revenue * 0.05),
    }));
  }
  return entries.map(([name, v]) => ({ name, ...v }));
}

export function filterInvoicesClient(
  invoices: FinanceInvoice[],
  filters: { status?: string; customer?: string; search?: string }
): FinanceInvoice[] {
  return invoices.filter((inv) => {
    if (filters.status && filters.status !== "all" && inv.status !== filters.status) return false;
    if (filters.customer && filters.customer !== "all") {
      if (!inv.clientName.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const match =
        inv.number.toLowerCase().includes(s) ||
        inv.clientName.toLowerCase().includes(s) ||
        (inv.clientEmail?.toLowerCase().includes(s) ?? false);
      if (!match) return false;
    }
    return true;
  });
}

export function getUniqueCustomers(invoices: FinanceInvoice[]): string[] {
  return [...new Set(invoices.map((i) => i.clientName))].sort();
}
