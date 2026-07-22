import { z } from "zod";

export const taxModeSchema = z.enum(["NO_TAX", "EXCLUSIVE", "INCLUSIVE"]);

export const taxProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  taxType: z.string().optional(),
  ratePercent: z.number().min(0).max(100),
  mode: taxModeSchema,
  isDefault: z.boolean().optional(),
});

export const financeSettingsPatchSchema = z
  .object({
    taxEnabled: z.boolean().optional(),
    defaultTaxRate: z.number().min(0).max(100).optional(),
    taxMode: taxModeSchema.optional(),
    taxType: z.string().max(64).nullable().optional(),
    allowOverridePerInvoice: z.boolean().optional(),
    allowOverridePerItem: z.boolean().optional(),
    currencyCode: z.string().length(3).optional(),
    decimalPrecision: z.number().int().min(0).max(6).optional(),
    taxProfiles: z.array(taxProfileSchema).optional(),
  })
  .strict();

export const invoiceLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  taxRatePercent: z.number().min(0).max(100).nullable().optional(),
  taxEnabled: z.boolean().nullable().optional(),
  courseId: z.string().optional(),
});

export const invoiceTaxOverrideSchema = z
  .object({
    taxEnabled: z.boolean().nullable().optional(),
    taxRatePercent: z.number().min(0).max(100).nullable().optional(),
    taxMode: taxModeSchema.nullable().optional(),
  })
  .optional();

export const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional().or(z.literal("")),
  dueDate: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
  discountAmount: z.number().nonnegative().optional(),
  taxOverride: invoiceTaxOverrideSchema,
  items: z.array(invoiceLineSchema).min(1),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type FinanceSettingsPatchInput = z.infer<typeof financeSettingsPatchSchema>;
