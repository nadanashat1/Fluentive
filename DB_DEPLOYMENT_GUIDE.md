# Database Migration Deployment Guide

## Issue: Prisma migrations hanging on Supabase pooler

**Problem**: Current DATABASE_URL uses pooler (port 6543) which doesn't work with Prisma migrations.

**Solution**: Use direct connection for migration, then switch back to pooler for runtime.

## Quick Fix Steps

### 1. Get Direct Connection String
Go to Supabase Dashboard → Database → Connection string → Direct connection string
It should look like:
```
postgresql://postgres.nfetwmyemseyiztzgbst:PASSWORD@aws-0-eu-west-1.supabase.co:5432/postgres
```

### 2. Update .env Temporarily
```bash
# Backup current
cp .env .env.backup

# Update DATABASE_URL to direct connection
DATABASE_URL="postgresql://postgres.nfetwmyemseyiztzgbst:PASSWORD@aws-0-eu-west-1.supabase.co:5432/postgres"
```

### 3. Run Migration
```bash
npx prisma db push
```

### 4. Restore Pooler Connection
```bash
# Restore original
cp .env.backup .env
```

## Current .env Analysis

Your current DIRECT_URL is incorrect:
```
DIRECT_URL="postgresql://postgres.nfetwmyemseyiztzgbst:OROscKkxZy1jd4gY@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

**Issue**: Still using `pooler.supabase.com` instead of direct host.

**Correct format**: `aws-0-eu-west-1.supabase.co:5432` (no pooler subdomain)

## Emergency Backup

If Prisma fails completely, use manual SQL:
```sql
-- File: migrations/add_refresh_token_hash.sql
ALTER TABLE "User" ADD COLUMN "refreshTokenHash" TEXT;
CREATE INDEX "User_refreshTokenHash_idx" ON "User"("refreshTokenHash");
```

## After Migration

✅ Your auth system will be production-ready with:
- Refresh token rotation
- Reuse detection
- Timing-safe comparison
- Security logging

Then proceed to frontend auth implementation.
