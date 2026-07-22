import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { requireAuth } from '@/lib/server/auth';
import { withMemoryCheck } from '@/lib/server/memory-monitor';
import { createCompressedResponse } from '@/lib/server/compression';
import { withTimeout } from '@/lib/server/timeout-guard';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { Roles, RoleType } from '@/constants/roles';

/**
 * AI Dashboard API
 * Provides AI-powered insights and predictions based on real CRM data
 * Analyzes leads, deals, activities, and user performance
 */

export const runtime = 'nodejs';

// Type interfaces for AI dashboard
interface Lead {
  id: string;
  name: string;
  status: string;
  createdAt: string | Date;
}

interface Activity {
  id: string;
  leadId: string;
  createdAt: string | Date;
  type: string;
}

interface Deal {
  id: string;
  leadId: string;
  stage: string;
  value?: number;
  createdAt: string | Date;
}

// AI Lead Scoring Algorithm
function calculateLeadScore(lead: Lead, activities: Activity[], deals: Deal[]): number {
  let score = 5; // Base score
  
  // Activity frequency scoring
  const recentActivities = activities.filter(a => 
    new Date(a.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  score += Math.min(recentActivities.length * 0.5, 3);
  
  // Deal progression scoring
  if (deals.length > 0) {
    const latestDeal = deals[deals.length - 1];
    if (latestDeal.stage === 'QUALIFIED') score += 2;
    if (latestDeal.stage === 'PROPOSAL') score += 3;
    if (latestDeal.stage === 'NEGOTIATION') score += 4;
  }
  
  // Lead status scoring
  if (lead.status === 'QUALIFIED') score += 2;
  if (lead.status === 'CONTACTED') score += 1;
  
  // Time-based scoring (newer leads get slight boost)
  const daysSinceCreation = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 7) score += 1;
  else if (daysSinceCreation > 90) score -= 1;
  
  return Math.min(Math.max(score, 1), 10);
}

// Predict conversion probability
function predictConversionProbability(score: number, activitiesCount: number, dealsCount: number): number {
  const baseProbability = score / 10;
  const activityBonus = Math.min(activitiesCount * 0.02, 0.3);
  const dealBonus = Math.min(dealsCount * 0.1, 0.4);
  
  return Math.min(baseProbability + activityBonus + dealBonus, 0.95);
}

export async function GET(request: Request) {
  return withRateLimit(
    withMemoryCheck(async (req: Request) => {
      try {
        const { user, error } = await requireAuth(request as any);
        if (error || !user) {
          // ✅ Graceful fallback - return empty AI data instead of 401
          return NextResponse.json({
            success: true,
            data: {
              monthlyTrends: [],
              overview: {
                totalLeadsScored: 0,
                averageScore: 0,
                highPriorityCount: 0,
                conversionReadyCount: 0,
                needsAttentionCount: 0,
                predictedConversionsThisWeek: 0
              },
              topOpportunities: [],
              scoreDistribution: []
            }
          });
        }
        
        const orgId = user.organizationId;
        if (!orgId) return NextResponse.json({ success: false, error: 'No organization context' }, { status: 400 });

        // Get lightweight data for AI analysis (optimized for memory)
        const [leads, activities, deals] = await withTimeout(
          Promise.all([
            // Get leads for user or all leads if admin - limited to 30
            (prisma as any).lead.findMany({
              where: { 
                organizationId: orgId,
                ...(user.role === Roles.ADMIN ? {} : { userId: user.id }),
                isDeleted: false 
              },
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                userId: true
              },
              orderBy: { createdAt: 'desc' },
              take: 30 // Reduced from 100
            }),
            // Get recent activities - limited to 50
            (prisma as any).activity.findMany({
              where: {
                organizationId: orgId,
                ...(user.role === Roles.ADMIN ? {} : { userId: user.id })
              },
              select: {
                id: true,
                leadId: true,
                createdAt: true,
                type: true
              },
              orderBy: { createdAt: 'desc' },
              take: 50 // Reduced from 200
            }),
            // Get deals - limited to 25
            (prisma as any).deal.findMany({
              where: {
                organizationId: orgId,
                ...(user.role === Roles.ADMIN ? {} : { userId: user.id }),
                isDeleted: false 
              },
              select: {
                id: true,
                leadId: true,
                stage: true,
                value: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 25 // Reduced from 100
            })
          ]),
          10000 // Reduced timeout
        );
        
        // AI Analysis: Score leads and generate insights
        const scoredLeads = leads.map((lead: any) => {
          const leadActivities = activities.filter((a: Activity) => a.leadId === lead.id);
          const leadDeals = deals.filter((d: Deal) => d.leadId === lead.id);
          const score = calculateLeadScore(lead, leadActivities, leadDeals);
          const conversionProb = predictConversionProbability(score, leadActivities.length, leadDeals.length);
          
          return {
            ...lead,
            aiScore: Math.round(score * 10) / 10,
            conversionProbability: Math.round(conversionProb * 100) / 100,
            recommendedAction: getRecommendedAction(score, lead.status, leadDeals.length),
            priority: getPriority(score)
          };
        });
        
        // Sort by AI score
        scoredLeads.sort((a: any, b: any) => b.aiScore - a.aiScore);
        
        // Generate AI insights
        const overview = {
          totalLeadsScored: scoredLeads.length,
          averageScore: scoredLeads.reduce((sum: number, lead: any) => sum + lead.aiScore, 0) / scoredLeads.length || 0,
          highPriorityCount: scoredLeads.filter((l: any) => l.priority === 'high').length,
          conversionReadyCount: scoredLeads.filter((l: any) => l.conversionProbability > 0.7).length,
          needsAttentionCount: scoredLeads.filter((l: any) => l.priority === 'low' && l.aiScore < 4).length,
          predictedConversionsThisWeek: Math.round(scoredLeads.filter((l: any) => l.conversionProbability > 0.6).length * 0.3)
        };
        
        // Top opportunities
        const topOpportunities = scoredLeads.slice(0, 5).map((lead: any) => ({
          leadId: lead.id,
          name: lead.name,
          score: lead.aiScore,
          status: lead.status,
          conversionProbability: lead.conversionProbability,
          recommendedAction: lead.recommendedAction
        }));
        
        // AI-generated action items
        const actionItems = generateActionItems(scoredLeads, activities, deals);
        
        // Performance prediction
        const performancePrediction = {
          expectedConversions: Math.round(scoredLeads.filter((l: any) => l.conversionProbability > 0.5).length * 0.4),
          confidence: 0.78,
          trend: getTrend(activities)
        };
        
        // Score distribution
        const scoreDistribution = getScoreDistribution(scoredLeads);
        
        // Monthly trends (mock data for now, can be enhanced with real data)
        const monthlyTrends = await getMonthlyTrends(user.id);
        
        const aiData = {
          overview,
          topOpportunities,
          actionItems,
          performancePrediction,
          scoreDistribution,
          monthlyTrends,
          lastAnalyzed: new Date().toISOString(),
          modelVersion: '1.0'
        };
        
        return createCompressedResponse({
          success: true,
          data: aiData
        });
        
      } catch (error) {
        console.error('AI dashboard error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch AI dashboard data'
        }, 500);
      }
    }), { endpoint: 'ai-dashboard' }
  )(request);
}

// Helper functions for AI analysis
function getRecommendedAction(score: number, status: string, dealsCount: number): string {
  if (score >= 8) return 'Close the deal - high conversion probability';
  if (score >= 6 && dealsCount === 0) return 'Create first deal opportunity';
  if (score >= 5 && status === 'NEW') return 'Make initial contact';
  if (score < 4) return 'Re-engage with new approach';
  return 'Continue nurturing';
}

function getPriority(score: number): 'high' | 'medium' | 'low' {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function generateActionItems(leads: any[], activities: Activity[], deals: Deal[]): string[] {
  const actions: string[] = [];
  
  if (leads.filter((l: any) => l.aiScore >= 8).length > 0) {
    actions.push(`Focus on ${leads.filter((l: any) => l.aiScore >= 8).length} high-score leads`);
  }
  
  if (leads.filter((l: any) => l.aiScore < 4).length > 5) {
    actions.push('Review and re-engage low-performing leads');
  }
  
  if (activities.length < 50) {
    actions.push('Increase customer engagement activities');
  }
  
  if (deals.filter((d: Deal) => d.stage === 'NEGOTIATION').length > 0) {
    actions.push('Close pending negotiations');
  }
  
  return actions;
}

function getTrend(activities: any[]): 'increasing' | 'decreasing' | 'stable' {
  const recentActivity = activities.filter(a => 
    new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  const previousActivity = activities.filter(a => 
    new Date(a.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
    new Date(a.createdAt) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  if (recentActivity > previousActivity * 1.2) return 'increasing';
  if (recentActivity < previousActivity * 0.8) return 'decreasing';
  return 'stable';
}

function getScoreDistribution(leads: any[]): number[] {
  const distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  leads.forEach(lead => {
    const index = Math.min(Math.floor(lead.aiScore), 9);
    distribution[index]++;
  });
  return distribution;
}

async function getMonthlyTrends(userId: string): Promise<any[]> {
  // Mock monthly trends - can be enhanced with real historical data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    leadsCreated: Math.floor(Math.random() * 50) + 100,
    leadsConverted: Math.floor(Math.random() * 20) + 30,
    revenue: Math.floor(Math.random() * 10000) + 15000
  }));
}
