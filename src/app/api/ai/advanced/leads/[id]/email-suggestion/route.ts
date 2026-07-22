import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await context.params;
    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose') || 'followup';

    let leadName = "Executive Lead";
    let company = "Enterprise Client";

    if (!leadId.startsWith("demo-")) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (lead) {
        leadName = lead.name || leadName;
        company = lead.company || company;
      }
    }

    let subject = `Following up on our AI integration discussion - ${company}`;
    let body = `Hi ${leadName},\n\nI hope you're having a great week.\n\nI'm following up on our recent conversation regarding Fluentive's enterprise AI capabilities. Our latest benchmarks show a 45% reduction in sales cycle duration for organizations operating at your scale.\n\nI'd love to schedule a quick 15-minute sync this Thursday to review our tailored migration strategy for ${company}.\n\nBest regards,\n${user.name}\nFluentive Enterprise Sales`;
    let tone = "Professional & Persuasive";
    let tips = [
      "Keep the email concise and focus on the 45% time-saving metric.",
      "Send early in the morning (around 8:30 AM local time) for best open rates.",
      "Personalize the greeting if you have mutual connections."
    ];

    if (purpose === "introduction") {
      subject = `Transforming sales workflows at ${company} with Enterprise AI`;
      body = `Hi ${leadName},\n\nI've been closely following ${company}'s impressive expansion and wanted to introduce Fluentive. We specialize in unifying CRM data, automated email follow-ups, and predictive revenue analytics into a single seamless platform.\n\nWould you be open to a brief introductory call next Tuesday to see a custom live demo?\n\nBest,\n${user.name}`;
      tone = "Enthusiastic & Value-Driven";
      tips = ["Focus on high-level value rather than feature lists.", "Highlight successful case studies in their specific industry."];
    } else if (purpose === "closing") {
      subject = `Finalizing our partnership agreement - ${company}`;
      body = `Hi ${leadName},\n\nWe are thrilled about the prospect of partnering with ${company}. I have attached the finalized proposal with the agreed enterprise SLA terms and custom onboarding timeline.\n\nPlease let me know if you have any final questions before we proceed with the contract signing.\n\nWarm regards,\n${user.name}`;
      tone = "Confident & Collaborative";
      tips = ["Ensure all attachments are correctly linked.", "Provide a clear and immediate next step for signing."];
    } else if (purpose === "reengagement") {
      subject = `Quick question regarding ${company}'s Q3 CRM roadmap`;
      body = `Hi ${leadName},\n\nIt's been a few months since we last touched base regarding your CRM automation goals. We recently launched our new Multi-Modal AI Command Center, which specifically addresses the data consolidation challenges we discussed.\n\nAre you still actively exploring CRM enhancements for Q3?\n\nBest,\n${user.name}`;
      tone = "Inquisitive & Helpful";
      tips = ["Keep it low-pressure to encourage a quick response.", "Include a one-sentence summary of new platform updates."];
    }

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        leadName,
        purpose,
        template: {
          subject,
          body,
          tone,
          tips
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("[Email Suggestion API] GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate email suggestion" }, { status: 500 });
  }
}
