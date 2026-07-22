"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import type { TaxMode } from "@/lib/finance/tax";

interface FinanceSettingsDto {
  id: string;
  organizationId: string;
  taxEnabled: boolean;
  defaultTaxRate: number;
  taxMode: TaxMode;
  taxType: string | null;
  allowOverridePerInvoice: boolean;
  allowOverridePerItem: boolean;
  currencyCode: string;
  decimalPrecision: number;
}

const TAX_MODES: { value: TaxMode; label: string }[] = [
  { value: "NO_TAX", label: "No Tax" },
  { value: "EXCLUSIVE", label: "Exclusive Tax (added on top)" },
  { value: "INCLUSIVE", label: "Inclusive Tax (included in prices)" },
];

export default function FinanceSettingsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<FinanceSettingsDto>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["finance-settings"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: FinanceSettingsDto }>("/api/finance/settings"),
  });

  useEffect(() => {
    if (data?.data) setForm(data.data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<FinanceSettingsDto>) =>
      apiFetch<{ success: boolean }>("/api/finance/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      showToast("Finance settings saved", "success");
      await queryClient.invalidateQueries({ queryKey: ["finance-settings"] });
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to save settings", "error");
    },
  });

  const update = (patch: Partial<FinanceSettingsDto>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.taxMode === "NO_TAX") {
        next.taxEnabled = false;
        next.defaultTaxRate = 0;
      }
      if (patch.taxEnabled === false) {
        next.taxMode = "NO_TAX";
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      taxEnabled: form.taxEnabled,
      defaultTaxRate: form.defaultTaxRate,
      taxMode: form.taxMode,
      taxType: form.taxType,
      allowOverridePerInvoice: form.allowOverridePerInvoice,
      allowOverridePerItem: form.allowOverridePerItem,
      currencyCode: form.currencyCode,
      decimalPrecision: form.decimalPrecision,
    });
  };

  return (
    <div className="min-h-full bg-[#f5f6fb] dark:bg-[#0b0614] pb-12">
      <div className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="text-brand" size={24} /> Finance Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manual tax control, currency formatting, and invoice defaults.
            </p>
          </div>
          <Link
            href="/finance"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft size={16} /> Back to Finance
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
        <div className="space-y-6 bg-white dark:bg-[#150a24] rounded-2xl border border-[#ececef] dark:border-[#2a2f3a] p-6 sm:p-8 shadow-sm">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/40" />
          ) : (
            <>
              <section>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Tax defaults</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Tax is never applied automatically unless enabled here or overridden on an invoice.
                </p>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.taxEnabled ?? false}
                      onChange={(e) => update({ taxEnabled: e.target.checked, taxMode: e.target.checked ? form.taxMode ?? "EXCLUSIVE" : "NO_TAX" })}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Enable tax by default for new invoices</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Default tax rate (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        disabled={!form.taxEnabled}
                        value={form.defaultTaxRate ?? 0}
                        onChange={(e) => update({ defaultTaxRate: parseFloat(e.target.value) || 0 })}
                        className="w-full h-11 px-3 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Tax type (optional)</label>
                      <input
                        type="text"
                        placeholder="VAT, GST, Sales Tax..."
                        value={form.taxType ?? ""}
                        onChange={(e) => update({ taxType: e.target.value || null })}
                        className="w-full h-11 px-3 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Tax mode</label>
                    <select
                      value={form.taxMode ?? "NO_TAX"}
                      onChange={(e) => update({ taxMode: e.target.value as TaxMode })}
                      className="w-full h-11 px-3 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm"
                    >
                      {TAX_MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.allowOverridePerInvoice ?? true}
                        onChange={(e) => update({ allowOverridePerInvoice: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-brand"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Allow override per invoice</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.allowOverridePerItem ?? true}
                        onChange={(e) => update({ allowOverridePerItem: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-brand"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Allow override per line item</span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="pt-6 border-t border-[#ececef] dark:border-[#2a2f3a]">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Currency &amp; precision</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Currency code</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={form.currencyCode ?? "USD"}
                      onChange={(e) => update({ currencyCode: e.target.value.toUpperCase() })}
                      className="w-full h-11 px-3 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Decimal precision</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={form.decimalPrecision ?? 2}
                      onChange={(e) => update({ decimalPrecision: parseInt(e.target.value, 10) || 2 })}
                      className="w-full h-11 px-3 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm"
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saveMutation.isPending || isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-soft bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark disabled:opacity-50"
            >
              <Save size={16} />
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
