/**
 * AI Governance — Foundational Infrastructure Layer
 *
 * These interfaces sit at the same architectural level as CacheProvider,
 * RateLimitProvider, EventProvider, and CircuitStateProvider.
 *
 * They are NOT feature utilities. They are platform primitives.
 *
 * Design:
 * - Interfaces defined here. Implementations are swappable (memory → Redis → billing API).
 * - All AI-facing routes wire through these interfaces. No direct quota/cost logic in routes.
 * - Memory-backed implementations are production-safe for single-instance deployments.
 *   Swap backends without changing any call sites.
 */
import 'server-only';
import { logger } from '@/lib/observability/logger';

// ── Shared types ───────────────────────────────────────────────────────────────

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  reason?: string;
}

export interface UsageSummary {
  orgId: string;
  period: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
}

export interface BudgetStatus {
  orgId: string;
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  percentUsed: number;
  overBudget: boolean;
}

// ── Interface contracts ────────────────────────────────────────────────────────

/** Enforces per-org, per-user AI request quotas. */
export interface AIQuotaProvider {
  checkQuota(orgId: string, userId: string): Promise<QuotaResult>;
  consumeQuota(orgId: string, userId: string, tokens: number): Promise<void>;
  resetQuota(orgId: string): Promise<void>;
}

/** Accounts for exact token usage per request for billing accuracy. */
export interface AITokenAccountingProvider {
  recordUsage(
    orgId: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void>;
  getUsageSummary(orgId: string, period: string): Promise<UsageSummary>;
}

/** Tracks cumulative AI cost per org against configurable budget thresholds. */
export interface AICostTracker {
  recordCost(orgId: string, costCents: number, provider: string): Promise<void>;
  getCost(orgId: string, period: string): Promise<number>;
  checkBudget(orgId: string): Promise<BudgetStatus>;
}

/** Deduplicates identical in-flight AI requests to prevent redundant provider calls. */
export interface AIRequestDeduplicator {
  isDuplicate(requestKey: string): Promise<boolean>;
  markInFlight(requestKey: string, ttlMs: number): Promise<void>;
  markComplete(requestKey: string): Promise<void>;
}

// ── Memory-backed implementations ─────────────────────────────────────────────
// Production-safe for single-instance Vercel deployments.
// No external dependencies. Swap to Redis implementations when multi-instance.

const DEFAULT_HOURLY_QUOTA = 200; // requests per org per hour
const DEFAULT_BUDGET_CENTS = 5000; // $50.00 per org per billing period

class MemoryAIQuotaProvider implements AIQuotaProvider {
  // Map of `${orgId}:${userId}` → { count, resetAt }
  private readonly store = new Map<string, { count: number; resetAt: Date }>();

  async checkQuota(orgId: string, userId: string): Promise<QuotaResult> {
    const key = `${orgId}:${userId}`;
    const now = new Date();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      // No entry or expired window — fresh quota.
      const resetAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      this.store.set(key, { count: 0, resetAt });
      return { allowed: true, remaining: DEFAULT_HOURLY_QUOTA, resetAt };
    }

    const remaining = Math.max(0, DEFAULT_HOURLY_QUOTA - entry.count);
    return {
      allowed: remaining > 0,
      remaining,
      resetAt: entry.resetAt,
      reason: remaining === 0 ? 'Hourly quota exhausted' : undefined,
    };
  }

  async consumeQuota(orgId: string, userId: string, _tokens: number): Promise<void> {
    const key = `${orgId}:${userId}`;
    const entry = this.store.get(key);
    if (entry) {
      entry.count += 1;
    }
  }

  async resetQuota(orgId: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(`${orgId}:`)) {
        this.store.delete(key);
      }
    }
    logger.info('ai-governance', `Quota reset for org ${orgId}`);
  }
}

class MemoryAITokenAccountingProvider implements AITokenAccountingProvider {
  // Map of `${orgId}:${period}` → UsageSummary
  private readonly store = new Map<string, UsageSummary>();

  private periodKey(orgId: string, period: string): string {
    return `${orgId}:${period}`;
  }

  async recordUsage(
    orgId: string,
    _model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const key = this.periodKey(orgId, period);
    const existing = this.store.get(key) ?? {
      orgId,
      period,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalRequests: 0,
    };
    existing.totalInputTokens += inputTokens;
    existing.totalOutputTokens += outputTokens;
    existing.totalRequests += 1;
    this.store.set(key, existing);
  }

  async getUsageSummary(orgId: string, period: string): Promise<UsageSummary> {
    return (
      this.store.get(this.periodKey(orgId, period)) ?? {
        orgId,
        period,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalRequests: 0,
      }
    );
  }
}

class MemoryAICostTracker implements AICostTracker {
  // Map of `${orgId}:${period}` → cost in cents
  private readonly costs = new Map<string, number>();

  async recordCost(orgId: string, costCents: number, provider: string): Promise<void> {
    const period = new Date().toISOString().slice(0, 7);
    const key = `${orgId}:${period}`;
    this.costs.set(key, (this.costs.get(key) ?? 0) + costCents);
    logger.info('ai-governance', `AI cost recorded`, { orgId, costCents, provider });
  }

  async getCost(orgId: string, period: string): Promise<number> {
    return this.costs.get(`${orgId}:${period}`) ?? 0;
  }

  async checkBudget(orgId: string): Promise<BudgetStatus> {
    const period = new Date().toISOString().slice(0, 7);
    const spentCents = await this.getCost(orgId, period);
    const remainingCents = Math.max(0, DEFAULT_BUDGET_CENTS - spentCents);
    return {
      orgId,
      budgetCents: DEFAULT_BUDGET_CENTS,
      spentCents,
      remainingCents,
      percentUsed: Math.round((spentCents / DEFAULT_BUDGET_CENTS) * 100),
      overBudget: spentCents >= DEFAULT_BUDGET_CENTS,
    };
  }
}

class MemoryAIRequestDeduplicator implements AIRequestDeduplicator {
  // Map of requestKey → expiry timestamp
  private readonly inflight = new Map<string, number>();

  async isDuplicate(requestKey: string): Promise<boolean> {
    const expiry = this.inflight.get(requestKey);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.inflight.delete(requestKey);
      return false;
    }
    return true;
  }

  async markInFlight(requestKey: string, ttlMs: number): Promise<void> {
    this.inflight.set(requestKey, Date.now() + ttlMs);
  }

  async markComplete(requestKey: string): Promise<void> {
    this.inflight.delete(requestKey);
  }
}

// ── Singleton registry ─────────────────────────────────────────────────────────
// Wire all AI routes through these instances.
// Replace implementations here when scaling to Redis — no call-site changes needed.

export const aiQuota: AIQuotaProvider = new MemoryAIQuotaProvider();
export const aiTokenAccounting: AITokenAccountingProvider = new MemoryAITokenAccountingProvider();
export const aiCostTracker: AICostTracker = new MemoryAICostTracker();
export const aiDeduplicator: AIRequestDeduplicator = new MemoryAIRequestDeduplicator();
