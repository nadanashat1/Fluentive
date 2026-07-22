# 🚀 PRODUCTION SETUP GUIDE - Database Migration

## 📋 Current Status
- ✅ Application deployed to production
- ✅ All security features active
- ❌ Database migration blocked by missing DATABASE_URL

## 🔧 DATABASE CONFIGURATION STEPS

### Step 1: Get Production Database URL
**Option A: Supabase (Recommended)**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project or create new one
3. Go to Settings → Database
4. Copy the connection string

**Option B: PostgreSQL Direct**
1. Get your PostgreSQL connection details
2. Format: `postgresql://username:password@host:port/database`

### Step 2: Update Environment Variables
**For Vercel Deployment:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `fluentive`
3. Go to Settings → Environment Variables
4. Add these variables:

```
DATABASE_URL=your_production_database_url
JWT_SECRET=your_32_char_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 3: Run Database Migration
```bash
# After setting environment variables
npx prisma db push --accept-data-loss
```

## 🔐 SECURITY NOTES

### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 32+ character random string
- `NEXT_PUBLIC_APP_URL` - Your production domain

### Optional but Recommended:
- `STRIPE_SECRET_KEY` - For payment processing
- `REDIS_URL` - For session caching
- `SENTRY_DSN` - For error tracking

## 🚨 CRITICAL SECURITY REMINDERS

1. **Never commit `.env` files to git**
2. **Use different database for production vs development**
3. **Rotate all secrets before going live**
4. **Test with sample data first**

## 📊 MIGRATION COMMANDS

```bash
# Check database connection
npx prisma db pull

# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial data (if needed)
npx prisma db seed
```

## 🎯 NEXT STEPS AFTER MIGRATION

1. ✅ Run migration command
2. ✅ Verify database schema
3. ✅ Test authentication flow
4. ✅ Create admin user account
5. ✅ Monitor application logs

## 🆘 EMERGENCY ROLLBACK

If migration fails:
```bash
# Reset database
npx prisma migrate reset

# Restore from backup
npx prisma db push --force-reset
```

## 📞 SUPPORT

- Database issues: Check Prisma docs
- Vercel issues: Check Vercel docs
- Security issues: Review security audit logs

---

**Ready to proceed with database migration once environment variables are configured!**
