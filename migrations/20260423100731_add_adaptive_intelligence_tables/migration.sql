-- CreateTable
CREATE TABLE "SystemDecision" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "actualOutcome" TEXT,
    "improvement" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemActionConfidence" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemActionConfidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatternHistory" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatternHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemDecision_type_idx" ON "SystemDecision"("type");

-- CreateIndex
CREATE INDEX "SystemDecision_status_idx" ON "SystemDecision"("status");

-- CreateIndex
CREATE INDEX "SystemDecision_timestamp_idx" ON "SystemDecision"("timestamp");

-- CreateIndex
CREATE INDEX "SystemActionConfidence_type_idx" ON "SystemActionConfidence"("type");

-- CreateIndex
CREATE INDEX "SystemActionConfidence_confidence_idx" ON "SystemActionConfidence"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "SystemActionConfidence_type_action_key" ON "SystemActionConfidence"("type", "action");

-- CreateIndex
CREATE INDEX "PatternHistory_type_idx" ON "PatternHistory"("type");

-- CreateIndex
CREATE INDEX "PatternHistory_severity_idx" ON "PatternHistory"("severity");

-- CreateIndex
CREATE INDEX "PatternHistory_timestamp_idx" ON "PatternHistory"("timestamp");
