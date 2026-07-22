# 🗄️ DATABASE SETUP - Vercel Environment Variables

## 🚨 Current Issue
```
DATABASE_URL is not set. Please configure your production database connection in Vercel dashboard.
```

## 🔧 Step-by-Step Solution

### 1. Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Select your project: `fluentive`

### 2. Configure Environment Variables
Navigate to: **Settings → Environment Variables**

Add these variables:

#### **Required Variables:**
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_32_character_random_string
```

#### **Optional but Recommended:**
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
REDIS_URL=rediss://your_redis_url
SENTRY_DSN=https://your_sentry_dsn
```

### 3. Database Options

#### **Option A: Supabase (Recommended)**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project or create new one
3. Go to Settings → Database
4. Copy the connection string
5. Format: `postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres`

#### **Option B: Railway**
1. Create PostgreSQL database on Railway
2. Get connection string from Railway dashboard
3. Format: `postgresql://postgres:[PASSWORD]@[HOST].railway.app:5432/railway`

#### **Option C: Neon**
1. Create PostgreSQL database on Neon
2. Get connection string from Neon dashboard
3. Format: `postgresql://[USERNAME]:[PASSWORD]@[HOST].neon.tech:5432/neondb`

### 4. Generate JWT Secret
```bash
# Generate secure 32-character secret
openssl rand -base64 32
```

### 5. After Configuration
Once environment variables are set in Vercel:

```bash
# Run database migration
npx prisma db push --accept-data-loss

# Verify migration success
npx prisma db pull
```

## ⚡ Quick Setup Commands

### For Supabase (Fastest):
```bash
# 1. Set variables in Vercel dashboard
# 2. Run this command
npx prisma db push --accept-data-loss
```

### Test Database Connection:
```bash
# Test connection before migration
npx prisma db pull

# If successful, run migration
npx prisma db push
```

## 🔐 Security Notes

1. **Never commit `.env` files** to git
2. **Use different database** for production vs development
3. **Rotate secrets regularly** - especially JWT_SECRET
4. **Test with sample data** before going live
5. **Backup database** regularly

## 📊 Migration Verification

After setting up database:
1. ✅ Health check: `curl https://your-app.vercel.app/api/health`
2. ✅ Authentication test: Try login/register
3. ✅ Database operations: Create/read/update records
4. ✅ Error handling: Test invalid requests

## 🎯 Expected Result

Once DATABASE_URL is configured:
- ✅ Migration will complete successfully
- ✅ All database features will be active
- ✅ User registration/login will work
- ✅ Your CRM will be 100% production ready

---

**Ready to proceed once you configure DATABASE_URL in Vercel dashboard!** 🚀
