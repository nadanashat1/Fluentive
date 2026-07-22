"use client";

import Link from "next/link";
import { MoreHorizontal, Mail, CheckCircle, Download, FileText } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import {
  formatCurrency,
  formatDate,
  formatRelativeDays,
  mapInvoiceStatus,
  isInvoiceOverdue,
} from "@/lib/finance/formatters";
import type { FinanceInvoice } from "@/lib/finance/types";
import { useState } from "react";
import toast from "react-hot-toast";

interface FinanceInvoicesSectionProps {
  invoices: FinanceInvoice[];
  isLoading?: boolean;
  search: string;
  onMarkPaid?: (id: string) => Promise<void>;
}

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  FAILED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function paymentProgress(invoice: FinanceInvoice): number {
  if (invoice.status === "PAID") return 100;
  if (invoice.status === "DRAFT") return 0;
  const issued = new Date(invoice.issueDate).getTime();
  const due = new Date(invoice.dueDate).getTime();
  const now = Date.now();
  const total = due - issued;
  if (total <= 0) return 50;
  const elapsed = now - issued;
  return Math.min(95, Math.max(5, Math.round((elapsed / total) * 100)));
}

export function FinanceInvoicesSection({
  invoices,
  isLoading,
  search,
  onMarkPaid,
}: FinanceInvoicesSectionProps) {
  const [actionId, setActionId] = useState<string | null>(null);

  const handleMarkPaid = async (id: string) => {
    if (!onMarkPaid) {
      toast("Mark as paid will be available when connected to the API", { icon: "ℹ️" });
      return;
    }
    setActionId(id);
    try {
      await onMarkPaid(id);
      toast.success("Invoice marked as paid");
    } catch {
      toast.error("Could not update invoice");
    } finally {
      setActionId(null);
    }
  };

  const handleResend = (invoice: FinanceInvoice) => {
    toast.success(`Resend queued for ${invoice.number} (demo)`);
  };

  const handleExportRow = (invoice: FinanceInvoice) => {
    const row = [
      invoice.number,
      invoice.clientName,
      invoice.total,
      invoice.status,
      invoice.issueDate,
    ].join(",");
    const blob = new Blob([row], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[#2f3440] dark:text-gray-100">Recent Invoices</h2>
        <Link href="/finance/invoices/new">
          <ActionButton className="inline-flex h-9 items-center gap-2 rounded-soft bg-brand px-4 text-[12px] font-bold text-white">
            <FileText size={16} />
            New invoice
          </ActionButton>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ececef] bg-white dark:border-[#2a2f3a] dark:bg-[#150a24]">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/50" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-3xl">
              📄
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No invoices found</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              {search
                ? "No invoices match your filters. Try adjusting search or status."
                : "Create your first invoice to start tracking revenue and collections."}
            </p>
            {!search && (
              <Link href="/finance/invoices/new" className="mt-6">
                <ActionButton className="bg-brand px-6 py-2 text-[13px] text-white">
                  Create your first invoice
                </ActionButton>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-[#0b0614]/60">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Invoice</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Client</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Due</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Progress</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const overdue = isInvoiceOverdue(invoice);
                  const progress = paymentProgress(invoice);
                  const statusKey = invoice.status;
                  const label = mapInvoiceStatus(invoice.status);

                  return (
                    <tr
                      key={invoice.id}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/20 ${
                        overdue ? "bg-red-50/40 dark:bg-red-950/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{invoice.number}</p>
                        <p className="text-[11px] text-gray-500">Issued {formatDate(invoice.issueDate)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{invoice.clientName}</p>
                        {invoice.clientEmail && (
                          <p className="text-[11px] text-gray-500">{invoice.clientEmail}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[14px]">{formatCurrency(invoice.total)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-1 text-[10px] font-bold tracking-wider ${
                            STATUS_STYLES[statusKey] ?? STATUS_STYLES.DRAFT
                          }`}
                        >
                          {label}
                        </span>
                        {overdue && invoice.status !== "PAID" && (
                          <p className="mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                            Overdue
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-600 dark:text-gray-400">
                        <p>{formatDate(invoice.dueDate)}</p>
                        <p className={overdue ? "text-red-600 dark:text-red-400" : ""}>
                          {formatRelativeDays(invoice.dueDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full transition-all ${
                              invoice.status === "PAID"
                                ? "bg-green-500"
                                : overdue
                                  ? "bg-red-500"
                                  : "bg-brand"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500">{progress}% cycle</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Export row"
                            onClick={() => handleExportRow(invoice)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Download size={14} />
                          </button>
                          {invoice.status !== "PAID" && (
                            <>
                              <button
                                type="button"
                                title="Resend"
                                onClick={() => handleResend(invoice)}
                                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <Mail size={14} />
                              </button>
                              <button
                                type="button"
                                title="Mark paid"
                                disabled={actionId === invoice.id}
                                onClick={() => handleMarkPaid(invoice.id)}
                                className="rounded p-1.5 text-brand hover:bg-brand/10 disabled:opacity-50"
                              >
                                <CheckCircle size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
