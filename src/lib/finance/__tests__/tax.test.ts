import {
  calculateInvoiceTotals,
  DEFAULT_FINANCE_TAX_SETTINGS,
  roundMoney,
} from "../tax";

describe("finance tax calculations", () => {
  const exclusiveEnabled = {
    ...DEFAULT_FINANCE_TAX_SETTINGS,
    taxEnabled: true,
    defaultTaxRate: 10,
    taxMode: "EXCLUSIVE" as const,
  };

  it("rounds money to precision", () => {
    expect(roundMoney(10.005, 2)).toBe(10.01);
    expect(roundMoney(NaN, 2)).toBe(0);
  });

  it("does not apply tax when disabled globally", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 2, unitPrice: 50 }],
      DEFAULT_FINANCE_TAX_SETTINGS
    );
    expect(result.subtotal).toBe(100);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(100);
    expect(result.taxEnabled).toBe(false);
  });

  it("applies exclusive tax from org settings", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 100 }],
      exclusiveEnabled
    );
    expect(result.subtotal).toBe(100);
    expect(result.tax).toBe(10);
    expect(result.total).toBe(110);
  });

  it("honors invoice-level no-tax override", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 100 }],
      exclusiveEnabled,
      { override: { taxEnabled: false, taxMode: "NO_TAX", taxRatePercent: 0 } }
    );
    expect(result.tax).toBe(0);
    expect(result.total).toBe(100);
  });

  it("honors custom invoice tax rate", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 200 }],
      exclusiveEnabled,
      { override: { taxEnabled: true, taxRatePercent: 5, taxMode: "EXCLUSIVE" } }
    );
    expect(result.tax).toBe(10);
    expect(result.total).toBe(210);
  });

  it("extracts inclusive tax from gross line amounts", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 110 }],
      {
        ...exclusiveEnabled,
        taxMode: "INCLUSIVE",
      }
    );
    expect(result.subtotal).toBe(110);
    expect(result.tax).toBe(10);
    expect(result.total).toBe(110);
  });

  it("applies per-item tax override", () => {
    const result = calculateInvoiceTotals(
      [
        { quantity: 1, unitPrice: 100, taxEnabled: true, taxRatePercent: 20 },
        { quantity: 1, unitPrice: 100, taxEnabled: false },
      ],
      exclusiveEnabled
    );
    expect(result.tax).toBe(20);
    expect(result.total).toBe(220);
  });

  it("subtracts discount from total", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 100 }],
      exclusiveEnabled,
      { discountAmount: 15 }
    );
    expect(result.total).toBe(95);
  });
});
