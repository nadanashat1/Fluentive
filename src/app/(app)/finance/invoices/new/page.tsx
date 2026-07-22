"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, FileText, User, Mail, Calendar, DollarSign, Percent } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import {
  previewInvoiceTotals,
  type TaxMode,
  type FinanceTaxSettings,
  DEFAULT_FINANCE_TAX_SETTINGS,
} from "@/lib/finance/tax";
import { formatCurrency } from "@/lib/finance/formatters";

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent?: number | null;
  taxEnabled?: boolean | null;
};

type TaxOverrideMode = "default" | "none" | "custom";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("Thank you for your business!");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxOverrideMode, setTaxOverrideMode] = useState<TaxOverrideMode>("default");
  const [customTaxRate, setCustomTaxRate] = useState(10);
  const [customTaxMode, setCustomTaxMode] = useState<TaxMode>("EXCLUSIVE");
  const [items, setItems] = useState<LineItem[]>([
    { description: "Enterprise Fluency Strategy Consulting", quantity: 1, unitPrice: 5000 },
  ]);

  const { data: settingsRes } = useQuery({
    queryKey: ["finance-settings"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: FinanceTaxSettings & { currencyCode?: string; decimalPrecision?: number } }>(
        "/api/finance/settings"
      ),
  });

  const settings: FinanceTaxSettings = settingsRes?.data ?? DEFAULT_FINANCE_TAX_SETTINGS;
  const currency = (settingsRes?.data as { currencyCode?: string })?.currencyCode ?? "USD";
  const precision = settings.decimalPrecision ?? 2;

  const taxOverride = useMemo(() => {
    if (!settings.allowOverridePerInvoice) return undefined;
    if (taxOverrideMode === "none") {
      return { taxEnabled: false, taxMode: "NO_TAX" as TaxMode, taxRatePercent: 0 };
    }
    if (taxOverrideMode === "custom") {
      return {
        taxEnabled: customTaxRate > 0,
        taxRatePercent: customTaxRate,
        taxMode: customTaxMode,
      };
    }
    return undefined;
  }, [taxOverrideMode, customTaxRate, customTaxMode, settings.allowOverridePerInvoice]);

  const preview = useMemo(
    () =>
      previewInvoiceTotals(items, settings, {
        override: taxOverride,
        discountAmount,
      }),
    [items, settings, taxOverride, discountAmount]
  );

  const fmt = (n: number) =>
    formatCurrency(n, { maximumFractionDigits: precision });

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      showToast("Invoice must contain at least one line item", "error");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number | boolean | null) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const saveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!clientName.trim() || !dueDate) {
      showToast("Client name and due date are required", "error");
      return;
    }

    if (items.some((item) => !item.description.trim() || item.unitPrice <= 0 || item.quantity <= 0)) {
      showToast("All line items must have a valid description, quantity, and unit price", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch<{ success: boolean }>("/api/finance/invoices", {
        method: "POST",
        body: JSON.stringify({
          clientName,
          clientEmail: clientEmail.trim() || undefined,
          dueDate,
          notes,
          discountAmount,
          taxOverride: settings.allowOverridePerInvoice ? taxOverride : undefined,
          items,
        }),
      });

      if (res.success) {
        showToast("Invoice created successfully", "success");
        router.push("/finance");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create invoice";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const taxLabel =
    preview.taxMode === "INCLUSIVE"
      ? `Tax (inclusive${preview.taxEnabled ? `, ${customTaxRate || settings.defaultTaxRate}%` : ""})`
      : preview.taxEnabled
        ? `Tax (${preview.taxMode === "EXCLUSIVE" ? "exclusive" : "none"})`
        : "Tax";

  return (
    <div className="min-h-full bg-[#f5f6fb] dark:bg-[#0b0614] pb-12">
      <div className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="text-emerald-500" size={24} /> Create New Invoice
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manual tax control — totals update live from your settings and overrides.
            </p>
          </div>
          <Link href="/finance" className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            Back to Finance
          </Link>
        </div>
      </div>

      <form onSubmit={saveInvoice} className="mx-auto mt-8 max-w-4xl px-4 sm:px-6">
        <div className="space-y-8 bg-white dark:bg-[#150a24] rounded-2xl border border-[#ececef] dark:border-[#2a2f3a] p-6 sm:p-8 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-[#ececef] dark:border-[#2a2f3a] flex items-center gap-2">
              <User size={18} className="text-brand" /> Billing Details
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Client Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Client Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Due Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Discount ({currency})</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm"
                />
              </div>
            </div>
          </div>

          {settings.allowOverridePerInvoice && (
            <div className="rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Percent size={16} className="text-brand" /> Invoice tax
              </h3>
              <div className="flex flex-wrap gap-3 mb-3">
                {(["default", "none", "custom"] as TaxOverrideMode[]).map((mode) => (
                  <label key={mode} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="taxOverride"
                      checked={taxOverrideMode === mode}
                      onChange={() => setTaxOverrideMode(mode)}
                    />
                    {mode === "default" && "Use org defaults"}
                    {mode === "none" && "No tax"}
                    {mode === "custom" && "Custom rate"}
                  </label>
                ))}
              </div>
              {taxOverrideMode === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={customTaxRate}
                    onChange={(e) => setCustomTaxRate(parseFloat(e.target.value) || 0)}
                    className="h-10 px-3 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] text-sm"
                    placeholder="Tax %"
                  />
                  <select
                    value={customTaxMode}
                    onChange={(e) => setCustomTaxMode(e.target.value as TaxMode)}
                    className="h-10 px-3 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] text-sm"
                  >
                    <option value="EXCLUSIVE">Exclusive</option>
                    <option value="INCLUSIVE">Inclusive</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#ececef] dark:border-[#2a2f3a]">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText size={18} className="text-purple-500" /> Line Items
              </h2>
              <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand">
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 bg-[#fbfbfe] dark:bg-[#0b0614] rounded-xl border border-[#ececef] dark:border-[#2a2f3a]">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      className="w-full sm:flex-1 h-10 px-3 rounded-lg border text-sm"
                      required
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value, 10) || 1)}
                      className="w-full sm:w-24 h-10 px-3 rounded-lg border text-sm"
                    />
                    <div className="relative w-full sm:w-36">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.unitPrice === 0 ? "" : item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full h-10 pl-8 pr-3 rounded-lg border text-sm"
                        required
                      />
                    </div>
                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {settings.allowOverridePerItem && (
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.taxEnabled === true}
                          onChange={(e) =>
                            updateItem(index, "taxEnabled", e.target.checked ? true : null)
                          }
                        />
                        Custom item tax
                      </label>
                      {item.taxEnabled && (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Item tax %"
                          value={item.taxRatePercent ?? ""}
                          onChange={(e) =>
                            updateItem(index, "taxRatePercent", parseFloat(e.target.value) || 0)
                          }
                          className="h-8 w-24 px-2 rounded border text-xs"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t flex flex-col items-end space-y-2 text-sm">
              <div className="flex justify-between w-72 text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(preview.subtotal)}</span>
              </div>
              {preview.discountAmount > 0 && (
                <div className="flex justify-between w-72 text-gray-600 dark:text-gray-400">
                  <span>Discount:</span>
                  <span>-{fmt(preview.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-72 text-gray-600 dark:text-gray-400">
                <span>{taxLabel}:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(preview.tax)}</span>
              </div>
              <div className="flex justify-between w-72 text-lg font-bold pt-2 border-t text-gray-900 dark:text-gray-100">
                <span>Total:</span>
                <span className="text-emerald-500">{fmt(preview.total)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-lg border text-sm resize-none"
            />
          </div>

          <div className="pt-6 border-t flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="h-10 px-5 text-sm font-semibold text-gray-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-soft bg-emerald-600 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Invoice"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
