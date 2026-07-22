// Startup Growth Engine - Referral & Viral Loop System
// Helps Fluentive grow organically through user referrals

import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet } from './redis';

// Use type assertion to bypass TypeScript errors temporarily
const prismaClient = prisma as any;

// ==========================================
// REFERRAL SYSTEM
// ==========================================

export interface ReferralData {
  referrerId: string;
  tenantId: string;
  inviteCode: string;
  email?: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  rewardGranted: boolean;
}

// Generate unique referral code
export function generateReferralCode(tenantId: string, userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `FL${tenantId.substring(0, 4)}${userId.substring(0, 4)}${timestamp}${random}`.toUpperCase();
}

// Create referral invitation
export async function createReferral(
  referrerId: string,
  tenantId: string,
  email?: string
): Promise<{ inviteCode: string; inviteUrl: string }> {
  const inviteCode = generateReferralCode(tenantId, referrerId);
  
  // Store in cache (expires in 7 days)
  await cacheSet(
    `referral:${inviteCode}`,
    {
      referrerId,
      tenantId,
      email,
      status: 'pending',
      createdAt: new Date(),
      rewardGranted: false,
    },
    7 * 24 * 60 * 60 // 7 days
  );
  
  return {
    inviteCode,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteCode}`,
  };
}

// Track referral click
export async function trackReferralClick(inviteCode: string): Promise<boolean> {
  const referral = await cacheGet<ReferralData>(`referral:${inviteCode}`);
  if (!referral) return false;
  
  // Track click analytics
  await cacheSet(
    `referral:clicks:${inviteCode}`,
    { count: 1, lastClick: new Date() },
    7 * 24 * 60 * 60
  );
  
  return true;
}

// Complete referral (when invited user signs up)
export async function completeReferral(
  inviteCode: string,
  newUserId: string
): Promise<boolean> {
  const referral = await cacheGet<ReferralData>(`referral:${inviteCode}`);
  if (!referral || referral.status !== 'pending') return false;
  
  // Update referral status
  await cacheSet(
    `referral:${inviteCode}`,
    {
      ...referral,
      status: 'completed',
      completedAt: new Date(),
    },
    7 * 24 * 60 * 60
  );
  
  // Grant rewards
  await grantReferralRewards(referral.referrerId, newUserId);
  
  return true;
}

// Grant rewards to both parties
async function grantReferralRewards(referrerId: string, newUserId: string): Promise<void> {
  // Grant AI credits to referrer
  await addAICredits(referrerId, 100); // 100 free AI credits
  
  // Grant starter credits to new user
  await addAICredits(newUserId, 50); // 50 free AI credits
  
  // Log the referral completion
  console.log(`Referral completed: ${referrerId} → ${newUserId}`);
}

// Get user's referrals
export async function getUserReferrals(userId: string): Promise<{
  total: number;
  completed: number;
  pending: number;
  rewards: number;
}> {
  // Query from database or cache
  const referrals = await prismaClient.$queryRaw<Array<{
    total: bigint;
    completed: bigint;
    pending: bigint;
  }>>`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM referrals
    WHERE referrerId = ${userId}
  `;
  
  return {
    total: Number(referrals[0]?.total || 0),
    completed: Number(referrals[0]?.completed || 0),
    pending: Number(referrals[0]?.pending || 0),
    rewards: Number(referrals[0]?.completed || 0) * 100, // 100 credits per referral
  };
}

// ==========================================
// AI CREDITS SYSTEM
// ==========================================

export interface AICredits {
  userId: string;
  balance: number;
  totalUsed: number;
  lastRefill: Date;
}

// Add AI credits to user
export async function addAICredits(userId: string, amount: number): Promise<void> {
  const cacheKey = `ai-credits:${userId}`;
  const current = await cacheGet<AICredits>(cacheKey);
  
  await cacheSet(
    cacheKey,
    {
      userId,
      balance: (current?.balance || 0) + amount,
      totalUsed: current?.totalUsed || 0,
      lastRefill: new Date(),
    },
    30 * 24 * 60 * 60 // 30 days
  );
}

// Use AI credits
export async function useAICredits(userId: string, amount: number = 1): Promise<boolean> {
  const cacheKey = `ai-credits:${userId}`;
  const current = await cacheGet<AICredits>(cacheKey);
  
  if (!current || current.balance < amount) {
    return false; // Insufficient credits
  }
  
  await cacheSet(
    cacheKey,
    {
      ...current,
      balance: current.balance - amount,
      totalUsed: current.totalUsed + amount,
    },
    30 * 24 * 60 * 60
  );
  
  return true;
}

// Get AI credits balance
export async function getAICredits(userId: string): Promise<AICredits> {
  const cacheKey = `ai-credits:${userId}`;
  const cached = await cacheGet<AICredits>(cacheKey);
  
  if (cached) return cached;
  
  // Default credits for new users
  const defaultCredits: AICredits = {
    userId,
    balance: 50, // 50 free credits on signup
    totalUsed: 0,
    lastRefill: new Date(),
  };
  
  await cacheSet(cacheKey, defaultCredits, 30 * 24 * 60 * 60);
  return defaultCredits;
}

// ==========================================
// VIRAL LOOP FEATURES
// ==========================================

export interface ViralAction {
  type: 'share_dashboard' | 'invite_team' | 'upgrade_plan' | 'complete_onboarding';
  userId: string;
  reward: number;
  completed: boolean;
}

// Track viral actions
export async function trackViralAction(
  userId: string,
  action: ViralAction['type']
): Promise<void> {
  const rewards: Record<ViralAction['type'], number> = {
    share_dashboard: 25,
    invite_team: 50,
    upgrade_plan: 200,
    complete_onboarding: 30,
  };
  
  const reward = rewards[action];
  
  // Add credits
  await addAICredits(userId, reward);
  
  // Log action
  console.log(`Viral action: ${action} by ${userId}, rewarded ${reward} credits`);
}

// Get growth stats for dashboard
export async function getGrowthStats(tenantId: string): Promise<{
  totalReferrals: number;
  conversionRate: number;
  viralCoefficient: number;
  topReferrers: Array<{ userId: string; count: number }>;
}> {
  // This would query actual data in production
  return {
    totalReferrals: 0,
    conversionRate: 0,
    viralCoefficient: 0,
    topReferrers: [],
  };
}

// ==========================================
// ONBOARDING OPTIMIZATION
// ==========================================

export interface OnboardingStep {
  step: number;
  title: string;
  completed: boolean;
  reward: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { step: 1, title: 'Complete profile', completed: false, reward: 10 },
  { step: 2, title: 'Add first lead', completed: false, reward: 20 },
  { step: 3, title: 'Create first deal', completed: false, reward: 20 },
  { step: 4, title: 'Invite team member', completed: false, reward: 50 },
  { step: 5, title: 'Use AI assistant', completed: false, reward: 30 },
];

// Complete onboarding step
export async function completeOnboardingStep(
  userId: string,
  stepNumber: number
): Promise<void> {
  const step = ONBOARDING_STEPS.find(s => s.step === stepNumber);
  if (!step) return;
  
  await addAICredits(userId, step.reward);
  
  // Track completion
  await cacheSet(
    `onboarding:${userId}:${stepNumber}`,
    { completed: true, completedAt: new Date() },
    365 * 24 * 60 * 60 // 1 year
  );
}

// Get user onboarding progress
export async function getOnboardingProgress(userId: string): Promise<{
  completed: number;
  total: number;
  steps: OnboardingStep[];
  totalRewards: number;
}> {
  const steps = await Promise.all(
    ONBOARDING_STEPS.map(async (step) => {
      const cached = await cacheGet<{ completed: boolean }>(
        `onboarding:${userId}:${step.step}`
      );
      return {
        ...step,
        completed: cached?.completed || false,
      };
    })
  );
  
  const completed = steps.filter(s => s.completed).length;
  const totalRewards = steps
    .filter(s => s.completed)
    .reduce((sum, s) => sum + s.reward, 0);
  
  return {
    completed,
    total: ONBOARDING_STEPS.length,
    steps,
    totalRewards,
  };
}

// ==========================================
// GROWTH METRICS
// ==========================================

export async function getStartupMetrics(): Promise<{
  mau: number; // Monthly Active Users
  activationRate: number; // % who complete onboarding
  retentionD1: number; // Day 1 retention
  retentionD7: number; // Day 7 retention
  retentionD30: number; // Day 30 retention
  nps: number; // Net Promoter Score
  viralCoefficient: number; // K-factor
  cac: number; // Customer Acquisition Cost
  ltv: number; // Lifetime Value
}> {
  // These would be calculated from actual analytics data
  return {
    mau: 0,
    activationRate: 0,
    retentionD1: 0,
    retentionD7: 0,
    retentionD30: 0,
    nps: 0,
    viralCoefficient: 0,
    cac: 0,
    ltv: 0,
  };
}
