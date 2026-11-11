-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AuthActionToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthEmailRate" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthEmailRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthActionToken_tokenHash_key" ON "AuthActionToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthActionToken_userId_purpose_idx" ON "AuthActionToken"("userId", "purpose");

-- CreateIndex
CREATE INDEX "AuthEmailRate_expiresAt_idx" ON "AuthEmailRate"("expiresAt");

-- AddForeignKey
ALTER TABLE "AuthActionToken" ADD CONSTRAINT "AuthActionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only auth storage. Never readable through the public Data API.
ALTER TABLE "AuthActionToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthEmailRate" ENABLE ROW LEVEL SECURITY;
