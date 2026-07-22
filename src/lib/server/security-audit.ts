import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type HeadersSource = { headers: Headers };

function clientMeta(request: HeadersSource) {
  const h = request.headers;
  return {
    ip: (h.get('x-forwarded-for') || '').split(',')[0].trim() || null,
    userAgent: h.get('user-agent'),
  };
}

/** Persist a row in `SecurityLog` (replaces legacy `auditLog` delegate). */
export async function logSecurityEvent(
  request: HeadersSource,
  input: {
    userId: string;
    email?: string | null;
    action: string;
    meta?: Record<string, unknown>;
    id?: string;
    createdAt?: Date;
  }
) {
  const { ip, userAgent } = clientMeta(request);
  return prisma.securityLog.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      userId: input.userId,
      email: input.email ?? undefined,
      action: input.action,
      meta: (input.meta ?? {}) as Prisma.InputJsonValue,
      ip,
      userAgent,
    },
  });
}

/** Shape compatible with older API consumers (`details`, `user`, `severity`). */
export async function fetchSecurityLogsWithUsers(
  where?: Prisma.SecurityLogWhereInput,
  options?: { take?: number }
) {
  const rows = await prisma.securityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.take,
    select: {
      id: true,
      userId: true,
      email: true,
      action: true,
      meta: true,
      ip: true,
      userAgent: true,
      createdAt: true,
    },
  });
  const userIds = [...new Set(rows.map((r) => r.userId).filter((x): x is string => !!x))];
  const users =
    userIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        });
  const map = Object.fromEntries(users.map((u) => [u.id, u]));
  return rows.map((r) => {
    const meta = (r.meta && typeof r.meta === 'object' ? r.meta : {}) as Record<string, unknown>;
    const severity = typeof meta.severity === 'string' ? meta.severity : 'info';
    return {
      id: r.id,
      action: r.action,
      severity,
      createdAt: r.createdAt,
      userId: r.userId,
      email: r.email,
      ip: r.ip,
      userAgent: r.userAgent,
      details: meta,
      user: r.userId ? map[r.userId] ?? null : null,
    };
  });
}
