import type { TaxMode } from "@prisma/client";

export type { TaxMode };

export interface TaxProfileStub {
  id: string;
  name: string;
  taxType?: string;
  ratePercent: number;
  mode: TaxMode;
  isDefault?: boolean;
}

export interface FinanceTaxSettings {
  taxEnabled: boolean;
  defaultTaxRate: number;
  taxMode: TaxMode;
  taxType?: string | null;
  allowOverridePerInvoice: boolean;
  allowOverridePerItem: boolean;
  decimalPrecision: number;
  taxProfiles?: TaxProfileStub[];
}

export interface InvoiceLineInput {
  quantity: number;
  unitPrice: number;
  taxRatePercent?: number | null;
  taxEnabled?: boolean | null;
}

export interface InvoiceTaxOverride {
  taxEnabled?: boolean | null;
  taxRatePercent?: number | null;
  taxMode?: TaxMode | null;
}

export interface CalculatedLine {
  lineSubtotal: number;
  taxAmount: number;
  lineTotal: number;
  taxRatePercent: number;
  taxEnabled: boolean;
}

export interface CalculatedInvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableSubtotal: number;
  tax: number;
  total: number;
  taxRatePercent: number;
  taxMode: TaxMode;
  taxEnabled: boolean;
  lines: CalculatedLine[];
}

export const DEFAULT_FINANCE_TAX_SETTINGS: FinanceTaxSettings = {
  taxEnabled: false,
  defaultTaxRate: 0,
  taxMode: "NO_TAX",
  allowOverridePerInvoice: true,
  allowOverridePerItem: true,
  decimalPrecision: 2,
  taxProfiles: [],
};

export function roundMoney(value: number, precision = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function resolveInvoiceTaxConfig(
  settings: FinanceTaxSettings,
  override?: InvoiceTaxOverride | null
): { taxEnabled: boolean; taxRatePercent: number; taxMode: TaxMode } {
  const canOverride = settings.allowOverridePerInvoice && override != null;

  if (canOverride) {
    const enabled =
      override?.taxEnabled ??
      (override?.taxMode === "NO_TAX"
        ? false
        : override?.taxRatePercent != null
          ? override.taxRatePercent > 0
          : settings.taxEnabled);

    const mode =
      override?.taxMode ??
      (enabled ? settings.taxMode : "NO_TAX");

    const rate =
      override?.taxRatePercent ??
      (enabled ? settings.defaultTaxRate : 0);

    if (!enabled || mode === "NO_TAX" || rate <= 0) {
      return { taxEnabled: false, taxRatePercent: 0, taxMode: "NO_TAX" };
    }
    return { taxEnabled: true, taxRatePercent: rate, taxMode: mode };
  }

  if (!settings.taxEnabled || settings.taxMode === "NO_TAX" || settings.defaultTaxRate <= 0) {
    return { taxEnabled: false, taxRatePercent: 0, taxMode: "NO_TAX" };
  }

  return {
    taxEnabled: true,
    taxRatePercent: settings.defaultTaxRate,
    taxMode: settings.taxMode,
  };
}

function resolveLineTaxConfig(
  settings: FinanceTaxSettings,
  invoiceConfig: ReturnType<typeof resolveInvoiceTaxConfig>,
  line: InvoiceLineInput
): { taxEnabled: boolean; taxRatePercent: number; taxMode: TaxMode } {
  if (!invoiceConfig.taxEnabled) {
    return { taxEnabled: false, taxRatePercent: 0, taxMode: "NO_TAX" };
  }

  if (settings.allowOverridePerItem && line.taxEnabled != null) {
    if (!line.taxEnabled) {
      return { taxEnabled: false, taxRatePercent: 0, taxMode: "NO_TAX" };
    }
    const rate = line.taxRatePercent ?? invoiceConfig.taxRatePercent;
    if (rate <= 0) {
      return { taxEnabled: false, taxRatePercent: 0, taxMode: "NO_TAX" };
    }
    return {
      taxEnabled: true,
      taxRatePercent: rate,
      taxMode: invoiceConfig.taxMode,
    };
  }

  if (settings.allowOverridePerItem && line.taxRatePercent != null && line.taxRatePercent > 0) {
    return {
      taxEnabled: true,
      taxRatePercent: line.taxRatePercent,
      taxMode: invoiceConfig.taxMode,
    };
  }

  return invoiceConfig;
}

function taxFromSubtotal(
  subtotal: number,
  ratePercent: number,
  mode: TaxMode,
  precision: number
): { tax: number; netSubtotal: number; grossTotal: number } {
  const sub = roundMoney(subtotal, precision);
  if (ratePercent <= 0 || mode === "NO_TAX") {
    return { tax: 0, netSubtotal: sub, grossTotal: sub };
  }
  const rate = ratePercent / 100;
  if (mode === "EXCLUSIVE") {
    const tax = roundMoney(sub * rate, precision);
    return { tax, netSubtotal: sub, grossTotal: roundMoney(sub + tax, precision) };
  }
  // INCLUSIVE: subtotal is gross (tax included)
  const net = roundMoney(sub / (1 + rate), precision);
  const tax = roundMoney(sub - net, precision);
  return { tax, netSubtotal: net, grossTotal: sub };
}

/**
 * Server-authoritative invoice totals from line items and org tax settings.
 * Does not apply a global auto-tax rate unless enabled in settings or overridden on the invoice.
 */
export function calculateInvoiceTotals(
  lines: InvoiceLineInput[],
  settings: FinanceTaxSettings,
  options?: {
    override?: InvoiceTaxOverride | null;
    discountAmount?: number;
  }
): CalculatedInvoiceTotals {
  const precision = settings.decimalPrecision ?? 2;
  const invoiceConfig = resolveInvoiceTaxConfig(settings, options?.override);
  const discountAmount = roundMoney(Math.max(0, options?.discountAmount ?? 0), precision);

  const calculatedLines: CalculatedLine[] = lines.map((line) => {
    const qty = Math.max(0, line.quantity || 0);
    const unit = Math.max(0, line.unitPrice || 0);
    const lineSubtotal = roundMoney(qty * unit, precision);
    const lineConfig = resolveLineTaxConfig(settings, invoiceConfig, line);
    const { tax, grossTotal } = taxFromSubtotal(
      lineSubtotal,
      lineConfig.taxRatePercent,
      lineConfig.taxMode,
      precision
    );
    return {
      lineSubtotal,
      taxAmount: tax,
      lineTotal: lineConfig.taxMode === "INCLUSIVE" ? grossTotal : roundMoney(lineSubtotal + tax, precision),
      taxRatePercent: lineConfig.taxRatePercent,
      taxEnabled: lineConfig.taxEnabled,
    };
  });

  const subtotal = roundMoney(
    calculatedLines.reduce((s, l) => s + l.lineSubtotal, 0),
    precision
  );
  const tax = roundMoney(
    calculatedLines.reduce((s, l) => s + l.taxAmount, 0),
    precision
  );
  const grossBeforeDiscount = roundMoney(subtotal + (invoiceConfig.taxMode === "EXCLUSIVE" ? tax : 0), precision);
  const total = roundMoney(Math.max(0, grossBeforeDiscount - discountAmount), precision);

  return {
    subtotal,
    discountAmount,
    taxableSubtotal: subtotal,
    tax,
    total,
    taxRatePercent: invoiceConfig.taxRatePercent,
    taxMode: invoiceConfig.taxMode,
    taxEnabled: invoiceConfig.taxEnabled,
    lines: calculatedLines,
  };
}

/** Client-side preview helper (same math as server). */
export function previewInvoiceTotals(
  lines: InvoiceLineInput[],
  settings: FinanceTaxSettings,
  options?: Parameters<typeof calculateInvoiceTotals>[2]
): Pick<CalculatedInvoiceTotals, "subtotal" | "tax" | "total" | "discountAmount" | "taxMode" | "taxEnabled"> {
  const r = calculateInvoiceTotals(lines, settings, options);
  return {
    subtotal: r.subtotal,
    tax: r.tax,
    total: r.total,
    discountAmount: r.discountAmount,
    taxMode: r.taxMode,
    taxEnabled: r.taxEnabled,
  };
}
