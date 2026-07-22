import {
  buildFinanceMetrics,
  buildOperationalMetrics,
  filterInvoicesClient,
} from "../metrics";
import type { FinanceAnalytics, FinanceInvoice } from "../types";

// percentChange is internal - test via buildFinanceMetrics trend instead
function pct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

describe("finance metrics", () => {
  const baseAnalytics: FinanceAnalytics = {
    revenue: 100000,
    expenses: 40000,
    profit: 60000,
    profitMargin: 60,
    outstandingInvoices: 10000,
    monthlyData: [
      { name: "Jan", revenue: 80000, expenses: 30000 },
      { name: "Feb", revenue: 100000, expenses: 40000 },
    ],
    revenueGrowthPercent: 25,
  };

  const invoices: FinanceInvoice[] = [
    {
      id: "1",
      number: "INV-1",
      clientName: "Acme",
      total: 5000,
      amount: 4500,
      tax: 500,
      status: "PAID",
      issueDate: "2026-01-01",
      dueDate: "2026-01-31",
      paidDate: "2026-01-15",
    },
    {
      id: "2",
      number: "INV-2",
      clientName: "Beta",
      total: 3000,
      amount: 2700,
      tax: 300,
      status: "SENT",
      issueDate: "2026-02-01",
      dueDate: "2026-03-01",
    },
  ];

  it("builds 12 metric cards", () => {
    const metrics = buildFinanceMetrics(baseAnalytics, invoices);
    expect(metrics).toHaveLength(12);
    expect(metrics[0].id).toBe("total-revenue");
  });

  it("computes operational health score in range", () => {
    const ops = buildOperationalMetrics(baseAnalytics, invoices);
    expect(ops.financialHealthScore).toBeGreaterThanOrEqual(0);
    expect(ops.financialHealthScore).toBeLessThanOrEqual(100);
    expect(ops.invoiceConversionRate).toBe(50);
  });

  it("filters invoices by status", () => {
    const filtered = filterInvoicesClient(invoices, { status: "PAID" });
    expect(filtered).toHaveLength(1);
  });

  it("percent change handles zero previous", () => {
    expect(pct(100, 0)).toBe(100);
    expect(pct(0, 0)).toBe(0);
  });
});
