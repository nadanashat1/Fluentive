import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server/middleware/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.role || !hasPermission(user.role, "admin.security")) {
    return NextResponse.json({ error: "Forbidden - Admin security access required" }, { status: 403 });
  }

  const rows = await prisma.securityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const userIds = [...new Set(rows.map((r) => r.userId).filter((x): x is string => !!x))];
  const users =
    userIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, role: true }
        });
  const map = Object.fromEntries(users.map((u) => [u.id, u]));

  const logs = rows.map((r) => ({
    ...r,
    user: r.userId ? map[r.userId] ?? null : null
  }));

  return NextResponse.json(logs);
}
