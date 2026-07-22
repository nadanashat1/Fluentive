# Fluentive CRM - SaaS Multi-Tenant Migration Guide

## 🎯 Goal: Convert to Multi-Tenant SaaS Architecture

This guide helps you transform Fluentive from a single-tenant CRM to a **multi-tenant SaaS platform** where multiple companies can use the same application with complete data isolation.

---

## 📊 Current vs SaaS Architecture

### Current (Single Tenant)
```
Single Database → All Users → All Data
```

### SaaS (Multi-Tenant)
```
Single Database → Tenants → Isolated Users & Data
├── Company A (tenant-1)
│   ├── Users: Alice, Bob
│   └── Leads, Deals (isolated)
├── Company B (tenant-2)
│   ├── Users: Charlie, Diana
│   └── Leads, Deals (isolated)
└── Company C (tenant-3)
    └── ...
```

---

## 🚀 Migration Steps

### Step 1: Update Prisma Schema

1. **Backup your current database**
```bash
# Export your data first!
npx prisma migrate dev --create-only --name backup_before_saas
```

2. **Apply SaaS Schema**
```bash
# Replace schema.prisma with schema-saas.prisma
copy prisma\schema-saas.prisma prisma\schema.prisma

# Generate new Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name saas_multi_tenant
```

### Step 2: Migrate Existing Data

Create a migration script (`scripts/migrate-to-saas.ts`):

```typescript
// This script migrates existing data to SaaS architecture
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToSaaS() {
  // 1. Create default tenant for existing data
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: 'Default Organization',
      slug: 'default',
      plan: 'enterprise', // Give existing users full access
      status: 'active',
    },
  });

  // 2. Migrate users to tenant
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: defaultTenant.id },
    });
  }

  // 3. Migrate leads to tenant
  await prisma.lead.updateMany({
    data: { tenantId: defaultTenant.id },
  });

  // 4. Migrate deals to tenant
  await prisma.deal.updateMany({
    data: { tenantId: defaultTenant.id },
  });

  // 5. Migrate other tables...

  console.log('✅ Migration complete!');
  console.log(`Default Tenant ID: ${defaultTenant.id}`);
}

migrateToSaaS()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the migration:
```bash
npx ts-node scripts/migrate-to-saas.ts
```

### Step 3: Update Environment Variables

Add to `.env`:
```env
# SaaS Configuration
DEFAULT_TENANT_ID=your-migrated-tenant-id

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Plans
FREE_PLAN_MAX_USERS=3
FREE_PLAN_MAX_LEADS=100
PRO_PLAN_MAX_USERS=10
PRO_PLAN_MAX_LEADS=1000
```

### Step 4: Update API Routes

All API routes must include tenant isolation. Example:

**Before:**
```typescript
// Single tenant - no isolation
const leads = await prisma.lead.findMany();
```

**After:**
```typescript
// Multi-tenant - isolated by tenantId
import { requireSaaSAuth } from '@/lib/server/saas-auth';

const context = await requireSaaSAuth();
const leads = await prisma.lead.findMany({
  where: { tenantId: context.tenantId },
});
```

### Step 5: Add SaaS UI Components

**Tenant Switcher (if user belongs to multiple tenants):**
```typescript
// components/tenant-switcher.tsx
export function TenantSwitcher() {
  // Show dropdown if user has multiple tenants
}
```

**Billing Page:**
```typescript
// app/(app)/billing/page.tsx
export default function BillingPage() {
  // Show current plan, usage, upgrade button
}
```

---

## 🔐 Security Rules (CRITICAL)

### 1. Tenant Isolation Rule
**EVERY** database query MUST include `tenantId`:

```typescript
// ✅ CORRECT - Tenant isolated
prisma.lead.findMany({ where: { tenantId: context.tenantId } });

// ❌ WRONG - Data leak risk!
prisma.lead.findMany();
```

### 2. Authorization Middleware
Always verify tenant ownership:

```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const context = await requireSaaSAuth();
  
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
  });
  
  // Verify lead belongs to tenant
  if (lead?.tenantId !== context.tenantId) {
    return new Response('Not found', { status: 404 });
  }
  
  return Response.json({ data: lead });
}
```

### 3. Plan Limits Enforcement
Check limits before creating resources:

```typescript
import { checkTenantLimit, PlanLimitError } from '@/lib/server/billing';

export async function POST(request: Request) {
  const context = await requireSaaSAuth();
  
  // Check plan limit
  const limit = await checkTenantLimit(context.tenantId, 'leads');
  if (!limit.allowed) {
    throw new PlanLimitError('leads', limit.limit);
  }
  
  // Create lead
  const lead = await prisma.lead.create({
    data: {
      tenantId: context.tenantId,
      // ... other data
    },
  });
  
  return Response.json({ data: lead });
}
```

---

## 💳 Billing Integration

### 1. Setup Stripe
```bash
# Install Stripe
npm install stripe

# Configure webhook
# Go to Stripe Dashboard → Developers → Webhooks
# Add endpoint: https://your-app.com/api/webhooks/stripe
```

### 2. Create Checkout Session
```typescript
// app/api/billing/checkout/route.ts
import { createStripeCheckoutSession } from '@/lib/server/billing';

export async function POST(request: Request) {
  const context = await requireSaaSAuth();
  
  const { url } = await createStripeCheckoutSession(
    context.tenantId,
    'price_pro_plan_id',
    `${process.env.FRONTEND_URL}/billing/success`,
    `${process.env.FRONTEND_URL}/billing/cancel`
  );
  
  return Response.json({ url });
}
```

### 3. Handle Webhooks
```typescript
// app/api/webhooks/stripe/route.ts
import { handleStripeWebhook } from '@/lib/server/billing';

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  // Verify webhook signature
  // ...
  
  await handleStripeWebhook(event);
  
  return Response.json({ received: true });
}
```

---

## 📈 SaaS Plans Configuration

Edit `src/lib/server/billing.ts`:

```typescript
export const SAAS_PLANS = {
  free: {
    name: 'Free',
    maxUsers: 3,
    maxLeads: 100,
    features: ['basic_leads'],
    stripePriceId: null,
  },
  pro: {
    name: 'Pro',
    maxUsers: 10,
    maxLeads: 1000,
    features: ['basic_leads', 'ai_tools', 'analytics'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  enterprise: {
    name: 'Enterprise',
    maxUsers: Infinity,
    maxLeads: Infinity,
    features: ['all'],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
};
```

---

## 🧪 Testing Multi-Tenancy

### Test Data Isolation
```typescript
// Create two tenants with same email
const tenant1 = await prisma.tenant.create({ data: { name: 'Company A', slug: 'company-a' } });
const tenant2 = await prisma.tenant.create({ data: { name: 'Company B', slug: 'company-b' } });

// Create users in different tenants with same email
await prisma.user.create({
  data: {
    email: 'john@example.com',
    tenantId: tenant1.id,
    // ...
  },
});

await prisma.user.create({
  data: {
    email: 'john@example.com', // Same email, different tenant
    tenantId: tenant2.id,
    // ...
  },
});

// Verify isolation
const leads1 = await prisma.lead.findMany({ where: { tenantId: tenant1.id } });
const leads2 = await prisma.lead.findMany({ where: { tenantId: tenant2.id } });
// leads1 should never see leads2 data
```

---

## 📋 Post-Migration Checklist

- [ ] Database migrated with tenant columns
- [ ] Existing data assigned to default tenant
- [ ] All API routes updated with tenant isolation
- [ ] Stripe billing configured
- [ ] Plan limits enforced
- [ ] Feature flags working
- [ ] Tenant isolation tested
- [ ] Billing flow tested (checkout, webhook, downgrade)
- [ ] Documentation updated

---

## 🚨 Common Migration Issues

### Issue 1: Foreign Key Constraints
**Problem:** Adding tenantId breaks existing foreign keys
**Solution:** Drop and recreate foreign keys after adding tenantId

### Issue 2: Unique Constraints
**Problem:** Email must be unique per tenant, not globally
**Solution:** Change `@@unique([email])` to `@@unique([tenantId, email])`

### Issue 3: API Routes Not Isolated
**Problem:** Forgot to add tenant filter
**Solution:** Add `where: { tenantId }` to ALL queries

---

## 🎯 Success Metrics

After migration:
- ✅ Multiple companies can register independently
- ✅ Data is completely isolated between tenants
- ✅ Billing works per tenant
- ✅ Plan limits are enforced
- ✅ Users can be in multiple tenants (optional)

---

**Your CRM is now a real SaaS product! 🚀**

Ready to onboard customers and charge subscriptions.
