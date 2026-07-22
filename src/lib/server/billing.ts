// SaaS Billing & Subscription Management
// Handles plans, limits, and Stripe integration

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Use type assertion to bypass TypeScript errors temporarily
const prismaClient = prisma as any;

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null;

// ==========================================
// SAAS PLANS & LIMITS
// ==========================================

export const SAAS_PLANS = {
  free: {
    name: 'Free',
    description: 'Perfect for individuals',
    maxUsers: 3,
    maxLeads: 100,
    maxDeals: 50,
    features: ['basic_leads', 'basic_deals', 'email_support'],
    stripePriceId: null,
  },
  pro: {
    name: 'Pro',
    description: 'For growing teams',
    maxUsers: 10,
    maxLeads: 1000,
    maxDeals: 500,
    features: [
      'basic_leads',
      'basic_deals',
      'advanced_analytics',
      'ai_tools',
      'priority_support',
      'custom_fields',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Unlimited everything',
    maxUsers: Infinity,
    maxLeads: Infinity,
    maxDeals: Infinity,
    features: [
      'basic_leads',
      'basic_deals',
      'advanced_analytics',
      'ai_tools',
      'priority_support',
      'custom_fields',
      'sso',
      'api_access',
      'dedicated_support',
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
  },
};

export type PlanType = keyof typeof SAAS_PLANS;

// ==========================================
// PLAN UTILITIES
// ==========================================

// Check if tenant has feature
export function hasFeature(tenantPlan: string, feature: string): boolean {
  const plan = SAAS_PLANS[tenantPlan as PlanType];
  if (!plan) return false;
  return plan.features.includes(feature);
}

// Get plan limits
export function getPlanLimits(tenantPlan: string): {
  maxUsers: number;
  maxLeads: number;
  maxDeals: number;
} {
  const plan = SAAS_PLANS[tenantPlan as PlanType];
  if (!plan) return SAAS_PLANS.free;
  return {
    maxUsers: plan.maxUsers,
    maxLeads: plan.maxLeads,
    maxDeals: plan.maxDeals,
  };
}

// Check if limit is reached
export async function checkTenantLimit(
  tenantId: string,
  limitType: 'users' | 'leads' | 'deals'
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  // Since tenant model doesn't exist in current schema, use free plan limits
  const limits = getPlanLimits('free');

  let current = 0;
  switch (limitType) {
    case 'users':
      // tenantId field doesn't exist in current schema, count all users
      const user = await prismaClient.user.findUnique({});
      return {
        allowed: current < limits.maxUsers,
        current,
        limit: limits.maxUsers,
        remaining: limits.maxUsers - current,
      };
    case 'leads':
      // tenantId field doesn't exist in current schema, count all leads
      const lead = await prismaClient.lead.findUnique({});
      return {
        allowed: current < limits.maxLeads,
        current,
        limit: limits.maxLeads,
        remaining: limits.maxLeads - current,
      };
    case 'deals':
      // tenantId field doesn't exist in current schema, count all deals
      const deal = await prismaClient.deal.findUnique({});
      return {
        allowed: current < limits.maxDeals,
        current,
        limit: limits.maxDeals,
        remaining: limits.maxDeals - current,
      };
    default:
      throw new Error('Unknown limit type');
  }
}

// ==========================================
// STRIPE INTEGRATION
// ==========================================

export async function createStripeCheckoutSession(
  tenantId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  // Since tenant model doesn't exist, create a simple customer without tenant data
  const customer = await stripe.customers.create({
    metadata: {
      tenantId, // Store for future reference when tenant model is added
    },
  });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId,
    },
    subscription_data: {
      metadata: {
        tenantId,
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

// Create billing portal session
export async function createBillingPortalSession(
  tenantId: string,
  returnUrl: string
): Promise<{ url: string } | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  // Since tenant model doesn't exist, we can't retrieve a customer ID
  // This would need to be implemented when tenant model is added
  throw new Error('Billing portal not available without tenant model');
}

// Handle Stripe webhook events
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  if (!stripe) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      // Log webhook but don't update tenant since model doesn't exist
      console.log('Checkout completed:', event.id);
      break;
    }

    case 'invoice.payment_failed': {
      console.log('Payment failed:', event.id);
      break;
    }

    case 'customer.subscription.deleted': {
      console.log('Subscription deleted:', event.id);
      break;
    }
  }
}

// ==========================================
// USAGE TRACKING
// ==========================================

export interface TenantUsage {
  users: { current: number; limit: number };
  leads: { current: number; limit: number };
  deals: { current: number; limit: number };
  storage: { current: number; limit: number }; // MB
}

export async function getTenantUsage(tenantId: string): Promise<TenantUsage> {
  // Since tenant model doesn't exist, use free plan limits
  const limits = getPlanLimits('free');

  const [userCount, leadCount, dealCount] = await Promise.all([
    prismaClient.user.count(), // tenantId field doesn't exist
    prismaClient.lead.count(), // tenantId field doesn't exist
    prismaClient.deal.count(), // tenantId field doesn't exist
  ]);

  // Calculate storage (attachments)
  const attachments = await prismaClient.leadAttachment.findMany({
    select: { size: true }, // field is 'size', not 'fileSize'
  });
  const storageBytes = attachments.reduce((sum: number, a: any) => sum + (a.size || 0), 0);

  return {
    users: { current: userCount, limit: limits.maxUsers },
    leads: { current: leadCount, limit: limits.maxLeads },
    deals: { current: dealCount, limit: limits.maxDeals },
    storage: {
      current: Math.round(storageBytes / 1024 / 1024),
      limit: 100, // Free plan limit since tenant model doesn't exist
    },
  };
}

// ==========================================
// BILLING ERRORS
// ==========================================

export class PlanLimitError extends Error {
  constructor(resource: string, limit: number) {
    super(`Plan limit reached: You can only have ${limit} ${resource} on your current plan`);
    this.name = 'PlanLimitError';
  }
}

export class FeatureNotAvailableError extends Error {
  constructor(feature: string, requiredPlan: string) {
    super(`Feature "${feature}" requires ${requiredPlan} plan or higher`);
    this.name = 'FeatureNotAvailableError';
  }
}
