import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/lib/server/middleware/auth";
import { withMemoryCheck } from "@/lib/server/memory-monitor";
import { createCompressedResponse } from "@/lib/server/compression";
import { withTimeout } from "@/lib/server/timeout-guard";
import { withRateLimit } from "@/lib/server/rate-limiter";
import { randomBytes } from "crypto";
import { Roles, RoleType } from '@/constants/roles';

const demoInvitations = [
  {
    id: "inv-1",
    email: "alex.wong@fluentive.com",
    role: "sales",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
    inviter: { id: "usr-1", name: "Sarah Connor", email: "sarah.c@fluentive.com" }
  },
  {
    id: "inv-2",
    email: "rachel.green@fluentive.com",
    role: "manager",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    inviter: { id: "usr-1", name: "Sarah Connor", email: "sarah.c@fluentive.com" }
  }
];

// POST /api/organizations/invitations - Invite user to organization
export async function POST(req: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (request: Request) => {
      try {
        const { user, error } = await requireAuth(request);
        if (error || !user) {
          return NextResponse.json({
            success: false,
            error: 'User not authenticated'
          }, { status: 401 });
        }
        
        const body = await request.json();
        const { email, role = Roles.SALES } = body;
        
        if (!email) {
          return createCompressedResponse({
            success: false,
            error: "Email is required"
          }, 400);
        }

        const orgId = user.organizationId || "org-demo";
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        if (orgId === "org-demo") {
          const newInv = {
            id: `inv-${Date.now()}`,
            email,
            role,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            inviter: { id: user.id, name: user.name, email: user.email }
          };
          demoInvitations.unshift(newInv);
          return createCompressedResponse({
            success: true,
            data: newInv,
            message: "Invitation sent successfully"
          }, 201);
        }
        
        const existingUser = await withTimeout(
          (prisma as any).user.findUnique({
            where: { email }
          }),
          5000
        );
        
        if (existingUser) {
          return createCompressedResponse({
            success: false,
            error: "User already exists"
          }, 400);
        }
        
        const invitation = await withTimeout(
          (prisma as any).organizationInvitation.create({
            data: {
              email,
              role,
              organizationId: orgId,
              token,
              invitedBy: user.id,
              expiresAt
            },
            include: {
              inviter: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          10000
        );
        
        return createCompressedResponse({
          success: true,
          data: invitation,
          message: "Invitation sent successfully"
        }, 201);
      } catch (error) {
        console.error('Invitation creation error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create invitation'
        }, 500);
      }
    }), { endpoint: 'invitations' }
  )(req);
}

// GET /api/organizations/invitations - List pending invitations
export async function GET(req: NextRequest) {
  return withRateLimit(
    withMemoryCheck(async (request: Request) => {
      try {
        const { user, error } = await requireAuth(request);
        if (error || !user) {
          return NextResponse.json({
            success: false,
            error: 'User not authenticated'
          }, { status: 401 });
        }
        
        const orgId = user.organizationId || "org-demo";
        
        let invitations: any[] = [];
        if (orgId !== "org-demo") {
          invitations = await withTimeout(
            (prisma as any).organizationInvitation.findMany({
              where: {
                organizationId: orgId,
                acceptedAt: null,
                expiresAt: { gt: new Date() },
                isDeleted: false
              },
              include: {
                inviter: {
                  select: { id: true, name: true, email: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            }),
            10000
          );
        }
        
        if (invitations.length === 0) {
          invitations = demoInvitations;
        }
        
        return createCompressedResponse({
          success: true,
          data: invitations
        });
      } catch (error) {
        console.error('Invitations fetch error:', error);
        return createCompressedResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch invitations'
        }, 500);
      }
    }), { endpoint: 'invitations' }
  )(req);
}
