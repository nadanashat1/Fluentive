export type FinanceDateRange = "7d" | "30d" | "90d" | "1y" | "quarter" | "year";
export type FinancePeriod = "monthly" | "quarterly" | "yearly";

export type InvoiceStatusUi =
  | "PAID"
  | "PENDING"
  | "OVERDUE"
  | "DRAFT"
  | "FAILED"
  | "SENT"
  | "CANCELLED";

export interface MonthlyDataPoint {
  name: string;
  revenue: number;
  expenses: number;
  profit?: number;
  cashFlow?: number;
}

export interface FinanceAnalytics {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  outstandingInvoices: number;
  monthlyData: MonthlyDataPoint[];
  /** Extended fields (optional for backward compatibility) */
  paidInvoicesTotal?: number;
  monthlyRevenue?: number;
  previousRevenue?: number;
  revenueGrowthPercent?: number;
  cashFlow?: number;
  avgDealValue?: number;
  forecastedRevenue?: number;
  subscriptionRevenue?: number;
  refundsLosses?: number;
  invoiceCounts?: Record<string, number>;
  topCustomers?: { name: string; total: number; percent: number }[];
  revenueBySource?: { name: string; value: number }[];
  paymentTrends?: { name: string; paid: number; pending: number; overdue: number }[];
  forecastData?: { name: string; actual: number; forecast: number }[];
  mrr?: number;
  arr?: number;
}

export interface FinanceInvoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail?: string | null;
  amount: number;
  tax: number;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  taxRatePercent?: number | null;
  taxModeOverride?: string | null;
  taxEnabledOverride?: boolean | null;
  discountAmount?: number;
  notes?: string | null;
  items?: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxAmount?: number;
    taxRatePercent?: number | null;
    taxEnabled?: boolean | null;
  }[];
}

export interface FinanceMetric {
  id: string;
  title: string;
  value: string;
  rawValue: number;
  trendPercent?: number;
  trendLabel?: string;
  trendPositive?: boolean;
  sparkline?: number[];
  icon?: string;
  format?: "currency" | "percent" | "number";
}

export interface FinanceInsight {
  id: string;
  type: "success" | "warning" | "info" | "danger";
  title: string;
  message: string;
}

export interface TimelineEvent {
  id: string;
  type: "payment" | "invoice" | "refund" | "renewal" | "failed" | "export";
  title: string;
  description: string;
  amount?: number;
  status?: string;
  timestamp: string;
  clientName?: string;
}

export interface OperationalMetrics {
  mrr: number;
  arr: number;
  churnImpact: number;
  topPayingCustomers: { name: string; total: number }[];
  invoiceConversionRate: number;
  avgPaymentDelayDays: number;
  unpaidRevenue: number;
  financialHealthScore: number;
}

export interface FinanceFiltersState {
  range: FinanceDateRange;
  period: FinancePeriod;
  status: string;
  customer: string;
  revenueSource: string;
  search: string;
}
