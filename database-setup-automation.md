# 🤖 DATABASE SETUP AUTOMATION SCRIPT

## 🎯 **Purpose**
Automate database configuration for Fluentive CRM production deployment.

## 📋 **Prerequisites**
- Vercel CLI installed
- PostgreSQL database ready (Supabase/Railway/Neon)
- OpenSSL for JWT secret generation

## 🚀 **Automation Script**

```bash
#!/bin/bash

# Fluentive CRM Database Setup Automation
# Usage: ./setup-database.sh [provider] [db-connection-string] [jwt-secret]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Fluentive CRM Database Setup Automation${NC}"

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ Error: Missing required arguments${NC}"
    echo -e "${YELLOW}Usage: ./setup-database.sh [provider] [db-connection-string] [jwt-secret]${NC}"
    echo -e "${BLUE}Providers: supabase, railway, neon, aws${NC}"
    exit 1
fi

PROVIDER=$1
DB_CONNECTION=$2
JWT_SECRET=$3

echo -e "${GREEN}✅ Provider: ${PROVIDER}${NC}"
echo -e "${GREEN}✅ Database connection received${NC}"

# Validate provider
case $PROVIDER in
    supabase|railway|neon|aws)
        echo -e "${GREEN}✅ Valid provider${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid provider: $PROVIDER${NC}"
        echo -e "${YELLOW}Valid providers: supabase, railway, neon, aws${NC}"
        exit 1
        ;;
esac

# Step 1: Set up Vercel CLI
echo -e "${BLUE}🔧 Step 1: Setting up Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Step 2: Login to Vercel
echo -e "${BLUE}🔧 Step 2: Logging into Vercel...${NC}"
vercel login

# Step 3: Set environment variables
echo -e "${BLUE}🔧 Step 3: Setting environment variables...${NC}"

# Set DATABASE_URL
echo -e "${YELLOW}Setting DATABASE_URL...${NC}"
vercel env add DATABASE_URL "$DB_CONNECTION"

# Set JWT_SECRET
echo -e "${YELLOW}Setting JWT_SECRET...${NC}"
vercel env add JWT_SECRET "$JWT_SECRET"

# Set optional production variables
echo -e "${YELLOW}Setting optional production variables...${NC}"
vercel env add NODE_ENV production
vercel env add NEXT_PUBLIC_APP_URL https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app

# Step 4: Deploy to production
echo -e "${BLUE}🔧 Step 4: Deploying to production...${NC}"
vercel --prod

# Step 5: Run database migration
echo -e "${BLUE}🔧 Step 5: Running database migration...${NC}"
npx prisma db push --accept-data-loss

# Step 6: Verify setup
echo -e "${BLUE}🔧 Step 6: Verifying setup...${NC}"

# Test database connection
if npx prisma db pull &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app/api/health)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Health endpoint working (200)${NC}"
else
    echo -e "${RED}❌ Health endpoint failed ($HEALTH_RESPONSE)${NC}"
fi

echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo -e "${BLUE}🌐 Production URL: https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app${NC}"
echo -e "${YELLOW}📊 Next steps: Test user registration and CRM functionality${NC}"
```

## 📋 **Manual Setup Commands**

### **For Supabase:**
```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set environment variables
vercel env add DATABASE_URL "postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
vercel env add JWT_SECRET "$JWT_SECRET"
vercel env add NODE_ENV production
vercel env add NEXT_PUBLIC_APP_URL https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app

# Deploy and migrate
vercel --prod
npx prisma db push --accept-data-loss
```

### **For Railway:**
```bash
# Set environment variables
vercel env add DATABASE_URL "postgresql://postgres:[PASSWORD]@[HOST].railway.app:5432/railway"
vercel env add JWT_SECRET "$JWT_SECRET"

# Deploy and migrate
vercel --prod
npx prisma db push --accept-data-loss
```

### **For Neon:**
```bash
# Set environment variables
vercel env add DATABASE_URL "postgresql://[USERNAME]:[PASSWORD]@[HOST].neon.tech:5432/neondb"
vercel env add JWT_SECRET "$JWT_SECRET"

# Deploy and migrate
vercel --prod
npx prisma db push --accept-data-loss
```

## 🔐 **Security Notes**

1. **Never commit `.env` files** to git
2. **Use different database** for production vs development
3. **Rotate secrets regularly** - especially JWT_SECRET
4. **Test with sample data** before going live
5. **Backup database** regularly

## 📊 **Expected Results**

After running setup:
- ✅ Database tables created automatically
- ✅ Environment variables configured securely
- ✅ Production deployment updated
- ✅ Database migration completed
- ✅ 100% production functionality

---

**Ready to automate your database setup!** 🚀
