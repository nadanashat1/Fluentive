import type { FinanceSettings, TaxMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FINANCE_TAX_SETTINGS,
  type FinanceTaxSettings,
  type TaxProfileStub,
} from "./tax";

export function mapFinanceSettings(row: FinanceSettings): FinanceTaxSettings & {
  id: string;
  organizationId: string;
  currencyCode: string;
  taxType: string | null;
  allowOverridePerInvoice: boolean;
  allowOverridePerItem: boolean;
} {
  const profiles = Array.isArray(row.taxProfiles)
    ? (row.taxProfiles as unknown as TaxProfileStub[])
    : [];

  return {
    id: row.id,
    organizationId: row.organizationId,
    taxEnabled: row.taxEnabled,
    defaultTaxRate: row.defaultTaxRate,
    taxMode: row.taxMode as TaxMode,
    taxType: row.taxType,
    allowOverridePerInvoice: row.allowOverridePerInvoice,
    allowOverridePerItem: row.allowOverridePerItem,
    currencyCode: row.currencyCode,
    decimalPrecision: row.decimalPrecision,
    taxProfiles: profiles,
  };
}

export async function getOrCreateFinanceSettings(organizationId: string) {
  const existing = await prisma.financeSettings.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;

  return prisma.financeSettings.create({
    data: {
      organizationId,
      taxEnabled: DEFAULT_FINANCE_TAX_SETTINGS.taxEnabled,
      defaultTaxRate: DEFAULT_FINANCE_TAX_SETTINGS.defaultTaxRate,
      taxMode: DEFAULT_FINANCE_TAX_SETTINGS.taxMode,
      allowOverridePerInvoice: DEFAULT_FINANCE_TAX_SETTINGS.allowOverridePerInvoice,
      allowOverridePerItem: DEFAULT_FINANCE_TAX_SETTINGS.allowOverridePerItem,
      decimalPrecision: DEFAULT_FINANCE_TAX_SETTINGS.decimalPrecision,
      taxProfiles: [],
    },
  });
}

export async function getFinanceTaxSettings(organizationId: string): Promise<FinanceTaxSettings> {
  const row = await getOrCreateFinanceSettings(organizationId);
  return mapFinanceSettings(row);
}
