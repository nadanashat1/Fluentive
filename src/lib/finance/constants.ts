export const FINANCE_CHART_COLORS = {
  brand: "#840A36",
  brandLight: "#a83d5c",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  muted: "#6b7280",
  chart: ["#840A36", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
} as const;

export const DEFAULT_ANALYTICS = {
  revenue: 0,
  expenses: 0,
  profit: 0,
  profitMargin: 0,
  outstandingInvoices: 0,
  monthlyData: [] as { name: string; revenue: number; expenses: number }[],
};
