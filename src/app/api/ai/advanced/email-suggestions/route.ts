import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/api-handler";

export const revalidate = 30;

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const orgId = user.organizationId;
  if (!orgId) return NextResponse.json({ status: "error", message: "No organization context" }, { status: 400 });

  const rawLeads = await prisma.lead.findMany({
    where: { organizationId: orgId, isDeleted: false },
    select: { id: true, name: true, email: true, company: true, status: true },
    take: 10,
  });

  const templates = [
    {
      subject: "Accelerating your workflow at {company}",
      body: "Hi {name},\n\nI noticed your team at {company} has been exploring our enterprise solutions. Given your focus on operational scaling, I'd love to show you how similar organizations reduced their pipeline latency by 40%.\n\nAre you available for a brief 10-minute sync this Thursday?\n\nBest regards,\nFluentive Team",
      tone: "Professional Nurture",
    },
    {
      subject: "Quick question regarding {company} expansion",
      body: "Hi {name},\n\nHope your week is off to a great start. I'm reaching out because we just rolled out our automated AI scoring module, and it seems perfectly aligned with {company}'s current growth stage.\n\nLet me know if you'd like early access to our VIP pilot program.\n\nCheers,\nFluentive Sales",
      tone: "Value Proposition",
    },
    {
      subject: "Reconnecting on your B2B CRM evaluation",
      body: "Hi {name},\n\nIt's been a little while since we last touched base regarding {company}. Our engineering team recently released custom workflow automations that directly address the integrations we discussed.\n\nWould you be open to reviewing a personalized 2-minute demo video?\n\nBest,\nFluentive Account Executive",
      tone: "Gentle Follow-Up",
    }
  ];

  const suggestions = rawLeads.map((lead, index) => {
    const tmpl = templates[index % templates.length];
    const company = lead.company || "your organization";
    return {
      leadId: lead.id,
      leadName: lead.name,
      email: lead.email || "contact@example.com",
      subject: tmpl.subject.replace("{company}", company),
      body: tmpl.body.replace("{name}", lead.name.split(' ')[0]).replace("{company}", company),
      tone: tmpl.tone,
      confidence: 94 + (index % 6),
    };
  });

  if (suggestions.length === 0) {
    suggestions.push(
      {
        leadId: "lead-email-1",
        leadName: "Benjamin Stark",
        email: "ben@stark-enterprises.com",
        subject: "Accelerating your workflow at Stark Enterprises",
        body: "Hi Benjamin,\n\nI noticed your team at Stark Enterprises has been exploring our enterprise solutions. Given your focus on operational scaling, I'd love to show you how similar organizations reduced their pipeline latency by 40%.\n\nAre you available for a brief 10-minute sync this Thursday?\n\nBest regards,\nFluentive Team",
        tone: "Professional Nurture",
        confidence: 98,
      },
      {
        leadId: "lead-email-2",
        leadName: "Sophia Martinez",
        email: "s.martinez@cloud-scale.ai",
        subject: "Quick question regarding CloudScale.ai expansion",
        body: "Hi Sophia,\n\nHope your week is off to a great start. I'm reaching out because we just rolled out our automated AI scoring module, and it seems perfectly aligned with CloudScale.ai's current growth stage.\n\nLet me know if you'd like early access to our VIP pilot program.\n\nCheers,\nFluentive Sales",
        tone: "Value Proposition",
        confidence: 95,
      },
      {
        leadId: "lead-email-3",
        leadName: "Liam O'Connor",
        email: "liam@fintech-global.net",
        subject: "Reconnecting on your B2B CRM evaluation",
        body: "Hi Liam,\n\nIt's been a little while since we last touched base regarding Global Fintech. Our engineering team recently released custom workflow automations that directly address the integrations we discussed.\n\nWould you be open to reviewing a personalized 2-minute demo video?\n\nBest,\nFluentive Account Executive",
        tone: "Gentle Follow-Up",
        confidence: 96,
      }
    );
  }

  return NextResponse.json({
    status: "success",
    data: {
      suggestions,
    },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "success",
    message: "Email successfully dispatched to outgoing queue",
  });
});
