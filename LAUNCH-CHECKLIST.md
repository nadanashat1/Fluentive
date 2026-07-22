# 🚀 FLUENTIVE CRM - PRODUCTION LAUNCH CHECKLIST

## Pre-Launch: 48 Hours Before Go-Live

---

## ✅ PHASE 1: CODE STABILITY (Day -2)

### 1.1 Clean Build Verification
```bash
# Run these commands and verify 0 errors
npm ci
npm run build
```

**Checklist:**
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical only)
- [ ] No "use client" missing in client components
- [ ] No server-only imports in client code

### 1.2 Component Verification
```bash
# Search for potential issues
grep -r "useState\|useEffect" src/app --include="*.tsx" | grep -v '"use client"'
```

**Checklist:**
- [ ] All components with hooks have "use client"
- [ ] No Prisma imports in client components
- [ ] No process.env access in client components (except NEXT_PUBLIC_*)

### 1.3 API Route Audit
**Check every API route has:**
- [ ] Proper error handling (try/catch)
- [ ] Authentication check
- [ ] Tenant isolation (tenantId in where clause)
- [ ] Rate limiting for auth endpoints
- [ ] Input validation (Zod schemas)

---

## ✅ PHASE 2: SECURITY HARDENING (Day -2)

### 2.1 Environment Variables
```bash
# Create production env file
cp .env.example .env.production
```

**Required Variables:**
```env
# CRITICAL - Rotate before launch
DATABASE_URL=postgresql://[NEW_ROTATED_URL]
JWT_SECRET=[NEW_32_CHAR_SECRET_MIN]
STRIPE_SECRET_KEY=sk_live_[NEW_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[NEW_SECRET]

# APP CONFIG
NEXT_PUBLIC_APP_URL=https://app.fluentive.com
FRONTEND_URL=https://app.fluentive.com

# OPTIONAL (But Recommended)
REDIS_URL=rediss://[UPSTASH_URL]
SENTRY_DSN=https://[SENTRY_KEY]
```

**Checklist:**
- [ ] DATABASE_URL rotated (new credentials)
- [ ] JWT_SECRET is 32+ random characters
- [ ] STRIPE keys are LIVE (not test)
- [ ] No secrets committed to git
- [ ] .env.production in .gitignore

### 2.2 Security Headers (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.stripe.com;" }
      ]
    }
  ]
}
```

### 2.3 Data Isolation Audit
**Critical Rule: Every query MUST include tenantId**

```typescript
// ✅ CORRECT
prisma.lead.findMany({ where: { tenantId: context.tenantId } });

// ❌ WRONG - SECURITY VULNERABILITY
prisma.lead.findMany();
```

**Checklist:**
- [ ] All Lead queries include tenantId
- [ ] All Deal queries include tenantId
- [ ] All User queries include tenantId
- [ ] All ActivityLog queries include tenantId
- [ ] All Notification queries include tenantId

---

## ✅ PHASE 3: PERFORMANCE OPTIMIZATION (Day -2)

### 3.1 Database Optimization
```sql
-- Run in Supabase SQL Editor
-- Already in: prisma/migrations/enterprise-indexes.sql

-- Most Critical Indexes:
CREATE INDEX CONCURRENTLY idx_leads_tenant ON "Lead"("tenantId");
CREATE INDEX CONCURRENTLY idx_deals_tenant ON "Deal"("tenantId");
CREATE INDEX CONCURRENTLY idx_users_tenant ON "User"("tenantId");
CREATE INDEX CONCURRENTLY idx_leads_tenant_status ON "Lead"("tenantId", status);
```

**Checklist:**
- [ ] All tenant indexes created
- [ ] Query performance < 100ms (test in Supabase)
- [ ] Connection pooling enabled (Supabase → Database → Pooling)

### 3.2 API Performance
**Checklist:**
- [ ] All list endpoints have pagination (default limit: 20)
- [ ] Heavy queries cached (Redis or in-memory)
- [ ] No N+1 queries (check Prisma logs)

### 3.3 Frontend Performance
**Checklist:**
- [ ] Next.js build output shows all pages green
- [ ] No large bundles (check .next/analyze if available)
- [ ] Images optimized (next/image used)

---

## ✅ PHASE 4: BILLING GO-LIVE (Day -2)

### 4.1 Stripe Configuration
```bash
# Verify LIVE mode
```

**Checklist:**
- [ ] Stripe account is LIVE (not test mode)
- [ ] Products created in Stripe Dashboard:
  - [ ] Pro Plan: $49/month
  - [ ] Business Plan: $99/month
- [ ] Price IDs added to environment variables
- [ ] Webhook endpoint configured:
  - URL: `https://app.fluentive.com/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Webhook signing secret added to env

### 4.2 Billing Flow Test
**Test in Stripe Test Mode first:**
- [ ] Create checkout session works
- [ ] Success redirect works
- [ ] Cancel redirect works
- [ ] Webhook receives events
- [ ] Subscription status updates in database

---

## ✅ PHASE 5: DEPLOYMENT PREPARATION (Day -1)

### 5.1 Vercel Configuration
```bash
# Set environment variables in Vercel Dashboard
```

**Vercel Project Settings:**
- [ ] Framework: Next.js
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm ci`

**Environment Variables (Vercel Dashboard):**
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] NEXT_PUBLIC_APP_URL
- [ ] FRONTEND_URL
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] STRIPE_PRO_PRICE_ID
- [ ] STRIPE_BUSINESS_PRICE_ID
- [ ] REDIS_URL (if using)
- [ ] SENTRY_DSN (if using)

### 5.2 Database Migration
```bash
# Run migration (production database)
npx prisma migrate deploy
```

**Checklist:**
- [ ] Migration successful
- [ ] Schema matches production
- [ ] No migration errors

### 5.3 Domain Configuration
- [ ] Domain added to Vercel: `app.fluentive.com`
- [ ] DNS records configured (CNAME → cname.vercel-dns.com)
- [ ] SSL certificate issued (automatic)
- [ ] Domain accessible via HTTPS

---

## ✅ PHASE 6: PRE-LAUNCH TESTING (Day -1)

### 6.1 Authentication Flow
```bash
# Test manually in browser
```

**Checklist:**
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] JWT token expires correctly (7 days)
- [ ] Password reset flow works
- [ ] Session persists across page reloads

### 6.2 CRM Core Features
**Checklist:**
- [ ] Create lead works
- [ ] Update lead works
- [ ] Delete lead works
- [ ] List leads (with pagination)
- [ ] Create deal works
- [ ] Update deal works
- [ ] Notes can be added to leads
- [ ] Attachments can be uploaded

### 6.3 AI Features
**Checklist:**
- [ ] AI endpoint responds < 5 seconds
- [ ] AI credits system works
- [ ] Error handling for AI failures
- [ ] Timeout handling implemented

### 6.4 Billing Features
**Checklist:**
- [ ] View pricing page
- [ ] Click upgrade opens Stripe checkout
- [ ] Successful payment redirects to app
- [ ] Subscription status updates
- [ ] Cancel subscription works
- [ ] Plan limits enforced (test with free plan)

### 6.5 Security Testing
**Checklist:**
- [ ] Cannot access other tenant's data
- [ ] API rejects requests without auth
- [ ] Rate limiting triggers after excessive requests
- [ ] XSS attempts are blocked

---

## ✅ PHASE 7: MONITORING SETUP (Day -1)

### 7.1 Error Tracking (Sentry Recommended)
```bash
npm install @sentry/nextjs
```

**Checklist:**
- [ ] Sentry DSN configured
- [ ] Error boundary in root layout
- [ ] API errors logged to Sentry
- [ ] Performance monitoring enabled

### 7.2 Logging
**Checklist:**
- [ ] Structured logging enabled
- [ ] Request logging (method, path, status, duration)
- [ ] Error logging (stack traces)
- [ ] No sensitive data in logs (passwords, tokens)

### 7.3 Health Checks
**Create `app/api/health/route.ts`:**
```typescript
export async function GET() {
  // Check database connection
  // Check external services
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

---

## ✅ PHASE 8: UX FINAL POLISH (Day -1)

### 8.1 Loading States
**Checklist:**
- [ ] Skeleton UI for data loading
- [ ] Loading spinners on buttons during actions
- [ ] Progress indicators for uploads
- [ ] No layout shift during loading

### 8.2 Empty States
**Checklist:**
- [ ] Empty state for no leads
- [ ] Empty state for no deals
- [ ] Empty state for no notifications
- [ ] Helpful CTA in empty states

### 8.3 Error Messages
**Checklist:**
- [ ] User-friendly error messages (not technical)
- [ ] Error recovery suggestions
- [ ] Toast notifications for errors
- [ ] Form validation errors inline

### 8.4 Mobile Responsiveness
**Checklist:**
- [ ] Test on mobile device (or Chrome DevTools)
- [ ] All features work on mobile
- [ ] Touch targets are large enough (44px min)
- [ ] No horizontal scrolling

---

## 🚀 PHASE 9: LAUNCH DAY (Day 0)

### 9.1 Final Checks (Before Deploy)
- [ ] Build passes locally
- [ ] All env variables set in Vercel
- [ ] Database migrated
- [ ] Stripe configured
- [ ] Domain configured
- [ ] Health check endpoint works

### 9.2 Deploy
```bash
# Deploy to production
git push origin main
# Or: vercel --prod
```

### 9.3 Post-Deploy Verification (Within 30 minutes)
- [ ] Site loads at custom domain
- [ ] SSL certificate valid
- [ ] Register test account
- [ ] Create test lead
- [ ] Test AI feature
- [ ] Test billing flow ( Stripe test mode)
- [ ] Check error monitoring (Sentry) - should be empty

---

## 📊 PHASE 10: POST-LAUNCH MONITORING (Day 0-7)

### 10.1 First Hour
- [ ] Monitor Vercel function errors
- [ ] Monitor database connection pool
- [ ] Check for failed requests
- [ ] Verify webhook deliveries (Stripe)

### 10.2 First Day
- [ ] Check user signups count
- [ ] Monitor API response times
- [ ] Check error rates (should be < 1%)
- [ ] Verify billing webhooks working

### 10.3 First Week
- [ ] Daily active users trending up
- [ ] No critical bugs reported
- [ ] Conversion rate from trial to paid
- [ ] Support tickets volume manageable

---

## 🚨 EMERGENCY ROLLBACK PLAN

If critical issues after launch:

```bash
# Rollback to previous version
git revert HEAD
# Or in Vercel dashboard → Deployments → Previous → Promote
```

**Communication:**
- Post status update on Twitter/LinkedIn
- Email affected users if data issue
- Update status page if you have one

---

## 📈 SUCCESS METRICS (Week 1 Targets)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.9% | Vercel dashboard |
| Signups | 50+ | Database count |
| Activation | 60%+ | Completed onboarding |
| API Error Rate | < 1% | Sentry/Vercel |
| Avg Response Time | < 200ms | Vercel analytics |

---

## 🎯 FINAL LAUNCH SIGN-OFF

**Before you press deploy, confirm:**

- [ ] **I have tested every feature manually**
- [ ] **I have rotated all secrets**
- [ ] **I have verified tenant isolation**
- [ ] **I have Stripe billing ready**
- [ ] **I have monitoring in place**
- [ ] **I am ready for users**

---

## 🚀 DEPLOY COMMAND

```bash
# Final deploy to production
git add .
git commit -m "🚀 PRODUCTION LAUNCH: Fluentive SaaS v1.0"
git push origin main
```

**Congratulations! You're now a SaaS founder.** 🎉

---

*Document Version: 1.0*
*Last Updated: Launch Day*
