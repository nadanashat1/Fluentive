import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

import { getUserFromToken } from "@/lib/server/middleware/auth";
import { requireTenantContext } from "@/lib/server/middleware/tenant";
import { Roles, RoleType } from '@/constants/roles';

const demoOrganization = {
  id: "org-demo",
  name: "Fluentive Enterprise",
  slug: "fluentive-enterprise",
  description: "Global AI-Powered CRM & Sales Management Enterprise",
  subscriptionTier: "ENTERPRISE",
  createdAt: new Date("2025-01-01").toISOString(),
  updatedAt: new Date("2026-05-01").toISOString(),
  users: [
    { id: "usr-1", name: "Sarah Connor", email: "sarah.c@fluentive.com", role: "admin", isActive: true, createdAt: new Date("2025-01-15").toISOString() },
    { id: "usr-2", name: "Marcus Brody", email: "marcus.b@fluentive.com", role: "manager", isActive: true, createdAt: new Date("2025-02-01").toISOString() },
    { id: "usr-3", name: "Devon Miles", email: "devon.m@fluentive.com", role: "sales", isActive: true, createdAt: new Date("2025-03-10").toISOString() },
    { id: "usr-4", name: "Elena Vance", email: "elena.v@fluentive.com", role: "sales", isActive: true, createdAt: new Date("2025-04-05").toISOString() }
  ],
  invitations: [
    { id: "inv-1", email: "alex.wong@fluentive.com", role: "sales", createdAt: new Date("2026-05-15").toISOString() },
    { id: "inv-2", email: "rachel.green@fluentive.com", role: "manager", createdAt: new Date("2026-05-16").toISOString() }
  ]
};

// GET /api/organizations - List user's organization(s)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    let organization = null;
    if (user.organizationId) {
      organization = await db.organization.findUnique({
        where: { id: user.organizationId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true
            }
          },
          invitations: {
            where: { acceptedAt: null },
            select: {
              id: true,
              email: true,
              role: true,
              createdAt: true
            }
          }
        }
      });
    }
    
    if (!organization) {
      organization = demoOrganization;
    }
    
    return NextResponse.json({ organization });
  } catch (error) {
    console.error("[Organizations] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create new organization (for new users)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (user.organizationId) {
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { name, slug, description } = body;
    
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }
    
    const existing = await db.organization.findUnique({
      where: { slug }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 400 }
      );
    }
    
    const result = await db.$transaction(async (tx: any) => {
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          description,
          subscriptionTier: "FREE"
        }
      });
      
      await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: organization.id,
          role: Roles.ADMIN
        }
      });
      
      return organization;
    });
    
    return NextResponse.json({ organization: result }, { status: 201 });
  } catch (error) {
    console.error("[Organizations] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
