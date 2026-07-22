import { NextRequest, NextResponse } from "next/server";
import { InvoiceStatus } from "@prisma/client";
import { requireAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { logFinanceActivity } from "@/lib/finance/activity";
import { getFinanceTaxSettings } from "@/lib/finance/settings";
import { calculateInvoiceTotals } from "@/lib/finance/tax";
import { createInvoiceSchema } from "@/lib/finance/validation";

export const runtime = "nodejs";

const demoInvoices = [
  {
    id: "inv-1",
    number: "INV-2026-0042",
    clientName: "Global Logistics Alliance",
    clientEmail: "billing@global-logistics.com",
    amount: 14500,
    tax: 1450,
    total: 15950,
    status: "PAID",
    issueDate: new Date("2026-05-01").toISOString(),
    dueDate: new Date("2026-05-31").toISOString(),
    paidDate: new Date("2026-05-10").toISOString(),
    createdAt: new Date("2026-05-01").toISOString(),
    updatedAt: new Date("2026-05-10").toISOString(),
  },
  {
    id: "inv-2",
    number: "INV-2026-0043",
    clientName: "Apex Software Solutions",
    clientEmail: "accounts@apex-soft.io",
    amount: 28000,
    tax: 2800,
    total: 30800,
    status: "SENT",
    issueDate: new Date("2026-05-12").toISOString(),
    dueDate: new Date("2026-06-12").toISOString(),
    paidDate: null,
    createdAt: new Date("2026-05-12").toISOString(),
    updatedAt: new Date("2026-05-12").toISOString(),
  },
  {
    id: "inv-3",
    number: "INV-2026-0044",
    clientName: "Vanguard Retail Corp",
    clientEmail: "ap@vanguardcorp.net",
    amount: 9200,
    tax: 920,
    total: 10120,
    status: "OVERDUE",
    issueDate: new Date("2026-04-10").toISOString(),
    dueDate: new Date("2026-05-10").toISOString(),
    paidDate: null,
    createdAt: new Date("2026-04-10").toISOString(),
    updatedAt: new Date("2026-05-11").toISOString(),
  },
];

function serializeInvoice(i: {
  createdAt: Date;
  updatedAt: Date;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  [key: string]: unknown;
}) {
  return {
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    issueDate: i.issueDate.toISOString(),
    dueDate: i.dueDate.toISOString(),
    paidDate: i.paidDate ? i.paidDate.toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ success: false, error: "No organization context" }, { status: 400 });

    const where: Record<string, unknown> = { organizationId: orgId, isDeleted: false };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { issueDate: "desc" },
      include: { items: true },
    });

    let resultList = invoices.map((i) => serializeInvoice(i));

    if (resultList.length === 0) {
      resultList = demoInvoices.filter((inv) => {
        if (status && inv.status !== status) return false;
        if (search) {
          const s = search.toLowerCase();
          return (
            inv.number.toLowerCase().includes(s) ||
            inv.clientName.toLowerCase().includes(s) ||
            (inv.clientEmail?.toLowerCase().includes(s) ?? false)
          );
        }
        return true;
      });
    }

    return NextResponse.json({ success: true, data: resultList });
  } catch (error) {
    console.error("[Finance Invoices API] GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "id and status are required" }, { status: 400 });
    }

    const orgId = user.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: "No organization context" }, { status: 400 });
    }

    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const allowed: InvoiceStatus[] = ["PAID", "SENT", "OVERDUE", "DRAFT", "CANCELLED"];
    if (!allowed.includes(status as InvoiceStatus)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: status as InvoiceStatus,
        ...(status === "PAID" ? { paidDate: new Date() } : {}),
      },
      include: { items: true },
    });

    if (status === "PAID") {
      await logFinanceActivity({
        userId: user.id,
        organizationId: orgId,
        action: "invoice_paid",
        entityType: "INVOICE",
        entityId: invoice.id,
        details: `Invoice ${invoice.number} marked paid (${invoice.total})`,
      });
    }

    return NextResponse.json({ success: true, data: serializeInvoice(invoice) });
  } catch (error) {
    console.error("[Finance Invoices API] PATCH failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ success: false, error: "User is not associated with an organization" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientName, clientEmail, dueDate, notes, items, status, discountAmount, taxOverride } =
      parsed.data;

    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid due date" }, { status: 400 });
    }

    const taxSettings = await getFinanceTaxSettings(user.organizationId);
    const totals = calculateInvoiceTotals(
      items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRatePercent: item.taxRatePercent,
        taxEnabled: item.taxEnabled,
      })),
      taxSettings,
      {
        override: taxOverride ?? undefined,
        discountAmount,
      }
    );

    const count = await prisma.invoice.count({ where: { organizationId: user.organizationId } });
    const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: user.organizationId,
        number,
        clientName,
        clientEmail: clientEmail?.trim() || null,
        amount: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        discountAmount: totals.discountAmount,
        taxRatePercent: totals.taxEnabled ? totals.taxRatePercent : null,
        taxModeOverride: taxOverride?.taxMode ?? (totals.taxEnabled ? totals.taxMode : "NO_TAX"),
        taxEnabledOverride: taxOverride?.taxEnabled ?? totals.taxEnabled,
        dueDate: due,
        notes,
        status: status ?? "SENT",
        items: {
          create: items.map((item, index) => {
            const line = totals.lines[index];
            return {
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: line?.lineSubtotal ?? item.quantity * item.unitPrice,
              taxAmount: line?.taxAmount ?? 0,
              taxRatePercent: line?.taxEnabled ? line.taxRatePercent : null,
              taxEnabled: line?.taxEnabled ?? false,
              ...(item.courseId ? { courseId: item.courseId } : {}),
            };
          }),
        },
      },
      include: { items: true },
    });

    await logFinanceActivity({
      userId: user.id,
      organizationId: user.organizationId,
      action: "invoice_created",
      entityType: "INVOICE",
      entityId: invoice.id,
      details: `Invoice ${invoice.number} created for ${clientName} (total ${invoice.total}, tax ${invoice.tax})`,
    });

    return NextResponse.json({ success: true, data: serializeInvoice(invoice) }, { status: 201 });
  } catch (error) {
    console.error("[Finance Invoices API] POST failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create invoice" }, { status: 500 });
  }
}
