-- AlterTable
ALTER TABLE "TimeTracking" ADD COLUMN     "activeSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "idleSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isIdle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "TimeTracking_isIdle_idx" ON "TimeTracking"("isIdle");
