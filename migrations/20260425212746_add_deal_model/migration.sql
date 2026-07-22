-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "company" TEXT,
    "source" TEXT,
    "dealValue" DOUBLE PRECISION,
    "timeline" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'qualification',
    "priority" TEXT NOT NULL DEFAULT 'warm',
    "assigneeName" TEXT,
    "course" TEXT,
    "internalNotes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "Deal_createdAt_idx" ON "Deal"("createdAt");
