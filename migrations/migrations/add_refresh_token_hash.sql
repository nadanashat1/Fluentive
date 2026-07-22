-- Add refreshTokenHash field to User table for refresh token reuse detection
-- Run this migration manually if Prisma push fails

ALTER TABLE "User" 
ADD COLUMN "refreshTokenHash" TEXT;

-- Create index for faster lookups (optional but recommended)
CREATE INDEX "User_refreshTokenHash_idx" ON "User"("refreshTokenHash");

-- Add comment for documentation
COMMENT ON COLUMN "User"."refreshTokenHash" IS 'Hash of current refresh token for reuse detection';
