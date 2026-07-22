-- CreateEnum
CREATE TYPE "TaxMode" AS ENUM ('NO_TAX', 'EXCLUSIVE', 'INCLUSIVE');

-- CreateTable
CREATE TABLE "finance_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxMode" "TaxMode" NOT NULL DEFAULT 'NO_TAX',
    "taxType" TEXT,
    "allowOverridePerInvoice" BOOLEAN NOT NULL DEFAULT true,
    "allowOverridePerItem" BOOLEAN NOT NULL DEFAULT true,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "decimalPrecision" INTEGER NOT NULL DEFAULT 2,
    "taxProfiles" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_settings_pkey" PRIMARY KEY ("id")
);

-- AlterTable invoices (nullable / defaulted — existing rows unchanged)
ALTER TABLE "invoices" ADD COLUMN "taxRatePercent" DOUBLE PRECISION,
ADD COLUMN "taxModeOverride" "TaxMode",
ADD COLUMN "taxEnabledOverride" BOOLEAN,
ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable invoice_items
ALTER TABLE "invoice_items" ADD COLUMN "taxRatePercent" DOUBLE PRECISION,
ADD COLUMN "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "taxEnabled" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "finance_settings_organizationId_key" ON "finance_settings"("organizationId");
CREATE INDEX "finance_settings_organizationId_idx" ON "finance_settings"("organizationId");

-- AddForeignKey
ALTER TABLE "finance_settings" ADD CONSTRAINT "finance_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
