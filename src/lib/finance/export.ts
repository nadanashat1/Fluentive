import type { FinanceInvoice, FinanceMetric } from "./types";

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportInvoicesToCsv(invoices: FinanceInvoice[], filename = "invoices-export.csv"): void {
  const headers = [
    "Invoice #",
    "Client",
    "Email",
    "Amount",
    "Tax",
    "Total",
    "Status",
    "Issue Date",
    "Due Date",
    "Paid Date",
  ];
  const rows = invoices.map((inv) =>
    [
      inv.number,
      inv.clientName,
      inv.clientEmail ?? "",
      inv.amount,
      inv.tax,
      inv.total,
      inv.status,
      inv.issueDate,
      inv.dueDate,
      inv.paidDate ?? "",
    ]
      .map(escapeCsvCell)
      .join(",")
  );
  downloadCsv([headers.join(","), ...rows].join("\n"), filename);
}

export function exportMetricsToCsv(metrics: FinanceMetric[], filename = "finance-metrics.csv"): void {
  const headers = ["Metric", "Value", "Trend %", "Trend Label"];
  const rows = metrics.map((m) =>
    [m.title, m.rawValue, m.trendPercent ?? "", m.trendLabel ?? ""]
      .map(escapeCsvCell)
      .join(",")
  );
  downloadCsv([headers.join(","), ...rows].join("\n"), filename);
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printFinanceSummary(title: string, lines: string[]): void {
  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #2f3440; }
      h1 { color: #840A36; font-size: 20px; }
      ul { line-height: 1.8; }
    </style></head>
    <body>
      <h1>${title}</h1>
      <ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p style="font-size:12px;color:#707483;">Generated ${new Date().toLocaleString()}</p>
    </body></html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}
