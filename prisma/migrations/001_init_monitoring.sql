-- CreateTable
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "device" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_tokenHash_idx" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_isActive_idx" ON "Session"("isActive");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Log" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "correlationId" TEXT,
    "metadata" JSONB,
    "endpoint" TEXT,
    "duration" INTEGER,
    "status" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Log_level_idx" ON "Log"("level");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Log_userId_idx" ON "Log"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Log_createdAt_idx" ON "Log"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Log_endpoint_idx" ON "Log"("endpoint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Log_correlationId_idx" ON "Log"("correlationId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Metric" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Metric_route_idx" ON "Metric"("route");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Metric_timestamp_idx" ON "Metric"("timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Metric_status_idx" ON "Metric"("status");
