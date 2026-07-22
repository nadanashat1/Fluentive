# 🗄️ DATABASE CONFIGURATION TEMPLATE

## 📋 **Copy-Paste Configuration for Vercel**

### **Step 1: Go to Vercel Dashboard**
1. Open: https://vercel.com/dashboard
2. Select your project: `fluentive`
3. Navigate to: Settings → Environment Variables

### **Step 2: Add Environment Variables**

Copy and paste these configurations:

#### **Required Variables:**
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_32_character_random_string
```

#### **Database Provider Options:**

**Option A: Supabase (Recommended)**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
```

**Option B: Railway**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].railway.app:5432/railway
```

**Option C: Neon**
```
DATABASE_URL=postgresql://[USERNAME]:[PASSWORD]@[HOST].neon.tech:5432/neondb
```

**Option D: AWS RDS**
```
DATABASE_URL=postgresql://[USERNAME]:[PASSWORD]@[HOST].rds.amazonaws.com:5432/[DATABASE]
```

#### **Optional but Recommended:**
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
REDIS_URL=rediss://default:[PASSWORD]@[HOST]:6379
SENTRY_DSN=https://[KEY]@sentry.io/[PROJECT_ID]
```

### **Step 3: Generate JWT Secret**

If you need to generate a secure JWT secret:
```bash
# Generate secure 32-character secret
openssl rand -base64 32
```

### **Step 4: Save and Deploy**

1. Click **Save** after adding variables
2. Wait for Vercel redeployment (2-3 minutes)
3. Run database migration:
   ```bash
   npx prisma db push --accept-data-loss
   ```

### **Step 5: Verify Configuration**

After deployment, verify:
```bash
# Test database connection
npx prisma db pull

# Test authentication
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app/api/auth/login
```

## 🎯 **Expected Result**

After completing these steps:
- ✅ Database tables created automatically
- ✅ User registration and login working
- ✅ Lead management functional
- ✅ Deal tracking active
- ✅ Analytics dashboard operational
- ✅ 100% production functionality

## 🚀 **Quick Setup Commands**

### For Supabase (Fastest):
```bash
# 1. Set DATABASE_URL in Vercel dashboard
# 2. Run migration
npx prisma db push --accept-data-loss
```

### For Manual Database Setup:
```bash
# Test connection
npx prisma db pull

# Push schema
npx prisma db push

# Generate client
npx prisma generate
```

## 🔐 **Security Notes**

1. **Never commit `.env` files** to git
2. **Use different database** for production vs development
3. **Rotate secrets regularly** - especially JWT_SECRET
4. **Test with sample data** before going live
5. **Backup database** regularly

---

**Ready to proceed once DATABASE_URL is configured in Vercel dashboard!** 🚀
