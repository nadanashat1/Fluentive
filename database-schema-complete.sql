-- Fluentive Database Schema
-- Production-ready SQL from Prisma schema.prisma
-- 4 tables, 4 enums, indexes, foreign keys only

-- ========================================
-- ENUM TYPES (4 total)
-- ========================================

CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST');
CREATE TYPE "DealStage" AS ENUM ('OPEN', 'WON', 'LOST');
CREATE TYPE "UserRole" AS ENUM ('USER', 'SALES', 'MANAGER', 'ADMIN');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- ========================================
-- TABLES (4 total)
-- ========================================

-- User Table: Authentication and user management
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'SALES',
    "lockUntil" TIMESTAMP(3),
    "loginAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "organization" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Lead Table: CRM leads and prospects
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "userId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Deal Table: Sales pipeline management
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "stage" "DealStage" NOT NULL DEFAULT 'OPEN',
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- Activity Table: Audit and activity logging
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- INDEXES (17 total)
-- ========================================

-- User indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Lead indexes
CREATE INDEX "Lead_email_idx" ON "Lead"("email");
CREATE INDEX "Lead_name_idx" ON "Lead"("name");
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_userId_status_idx" ON "Lead"("userId", "status");
CREATE INDEX "Lead_userId_createdAt_idx" ON "Lead"("userId", "createdAt");

-- Deal indexes
CREATE INDEX "Deal_userId_idx" ON "Deal"("userId");
CREATE INDEX "Deal_leadId_idx" ON "Deal"("leadId");
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");
CREATE INDEX "Deal_createdAt_idx" ON "Deal"("createdAt");
CREATE INDEX "Deal_userId_stage_idx" ON "Deal"("userId", "stage");
CREATE INDEX "Deal_leadId_createdAt_idx" ON "Deal"("leadId", "createdAt");

-- Activity indexes
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "Activity_leadId_idx" ON "Activity"("leadId");
CREATE INDEX "Activity_dealId_idx" ON "Activity"("dealId");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");
CREATE INDEX "Activity_leadId_createdAt_idx" ON "Activity"("leadId", "createdAt");
CREATE INDEX "Activity_dealId_createdAt_idx" ON "Activity"("dealId", "createdAt");

-- ========================================
-- FOREIGN KEY CONSTRAINTS (5 total)
-- ========================================

-- Lead -> User relationship
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deal -> Lead relationship
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deal -> User relationship
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Activity -> Deal relationship
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Activity -> Lead relationship
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Activity -> User relationship
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- SCHEMA SUMMARY
-- ========================================

/*
DATABASE STRUCTURE:
User
├── leads
│   └── deals
│       └── activities
└── activities

ANALYTICS = Derived from:
- Lead.createdAt (time series)
- Deal.stage/value (sales metrics)  
- Activity.type (activity tracking)

TOTALS: 4 tables, 4 enums, 17 indexes, 5 foreign keys
No refreshTokenHash field in User table
No analytics or refresh-token tables
*/
