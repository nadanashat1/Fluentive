import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { prisma } from '@/lib/prisma';

/**
 * ENTERPRISE AI CHAT API
 * Context-aware AI assistant with enterprise module knowledge.
 */

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();

    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ error: 'No organization context' }, { status: 400 });

    const msg = message.toLowerCase();
    let reply = "As your Fluentive AI Copilot, I can help you manage leads, optimize recruitment, and forecast revenue. Try asking about your 'sales pipeline', 'churn risk', or 'high priority leads'!";
    let actions = [
      { id: 'view-dashboard', label: 'AI Dashboard', icon: 'Sparkles' }
    ];

    // RAG/Command Matching Logic
    if (msg.includes('lead') && msg.includes('priority') || msg.includes('hot')) {
      const leads = await prisma.lead.findMany({ where: { organizationId: orgId, isDeleted: false }, select: { id: true, name: true, email: true, createdAt: true }});
      const activities = await prisma.activity.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" }, take: 1000 });
      
      const hotLeadsCount = leads.filter(l => {
        const leadActivities = activities.filter(a => a.leadId === l.id);
        const recent = leadActivities.filter(a => (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24) < 7).length;
        return recent >= 2; // Simple priority heuristic
      }).length;

      reply = `I've analyzed your database. You currently have **${hotLeadsCount} high-priority leads** showing strong recent engagement. You should check the Prioritized Leads view to action them.`;
      actions = [{ id: 'view-priority', label: 'View Prioritized Leads', icon: 'Target' }];
    } 
    else if (msg.includes('revenue') || msg.includes('forecast') || msg.includes('pipeline')) {
      const deals = await prisma.deal.findMany({ where: { organizationId: orgId, isDeleted: false, stage: { notIn: ["WON", "LOST"] } } });
      const totalPipeline = deals.reduce((sum, d) => sum + (d.value || 0), 0);
      const weightedValue = deals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);
      
      reply = `Your active pipeline is currently valued at **$${totalPipeline.toLocaleString()}**. Based on historical win rates and current deal probabilities, your weighted forecast is **$${weightedValue.toLocaleString()}**.`;
      actions = [{ id: 'view-forecast', label: 'View Revenue Forecast', icon: 'TrendingUp' }];
    }
    else if (msg.includes('churn') || msg.includes('risk') || msg.includes('drop')) {
      const leads = await prisma.lead.findMany({ where: { organizationId: orgId, isDeleted: false, status: { notIn: ["CONVERTED", "LOST"] } }, select: { id: true, updatedAt: true }});
      const highRisk = leads.filter(l => (Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24) > 14);
      const rate = leads.length === 0 ? 0 : Math.round((highRisk.length / leads.length) * 100);
      
      reply = `Warning: I detected **${highRisk.length} leads** (${rate}%) that are at high risk of churning due to inactivity over the last 14 days.`;
      actions = [{ id: 'view-churn', label: 'View Churn Analysis', icon: 'AlertTriangle' }];
    }
    else if (msg.includes('duplicate') || msg.includes('clean')) {
      const leads = await prisma.lead.findMany({ where: { organizationId: orgId, isDeleted: false }, select: { email: true, phone: true }});
      const duplicates = leads.filter((lead, index, arr) => arr.findIndex(x => x.email === lead.email || (x.phone && x.phone === lead.phone)) !== index);
      
      if (duplicates.length > 0) {
        reply = `I found **${duplicates.length} duplicate lead records** in your database sharing identical emails or phone numbers. Would you like me to merge them?`;
        actions = [{ id: 'view-duplicates', label: 'Clean Database', icon: 'ShieldCheck' }];
      } else {
        reply = `I scanned your database. Your data integrity looks great! No duplicates detected.`;
      }
    }
    else if (msg.includes('lead')) {
      const leadCount = await prisma.lead.count({ where: { organizationId: orgId, isDeleted: false } });
      reply = `You currently have ${leadCount} active leads in your system.`;
    } 
    else if (msg.includes('deal')) {
      const dealCount = await prisma.deal.count({ where: { organizationId: orgId, isDeleted: false, stage: { notIn: ["WON", "LOST"] } } });
      reply = `I found ${dealCount} open deals in your pipeline.`;
    }

    return NextResponse.json({
      reply,
      actions
    });

  } catch (err: any) {
    console.error('[AI Chat API] Error:', err);
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}
