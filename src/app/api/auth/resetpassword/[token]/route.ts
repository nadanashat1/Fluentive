import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { digest, validPassword } from '@/lib/server/auth-email';
import { hashPassword } from '@/lib/auth/password-service';
import { withRateLimit } from '@/lib/server/rate-limiter';
import { clearAuthCookies } from '@/lib/server/auth';
async function reset(request: Request) {
  const token = new URL(request.url).pathname.split('/').pop() || '';
  try {
    const { password } = await request.json();
    if (!validPassword(password)) return NextResponse.json({ success: false, error: 'Use at least 8 characters and no more than 72 UTF-8 bytes.' }, { status: 400 });
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error();
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async tx => {
      const record = await tx.authActionToken.findUnique({ where: { tokenHash: digest(token) }, include: { user: true } });
      if (!record || record.purpose !== 'reset' || record.expiresAt < new Date() || record.user.isDeleted || !record.user.isActive || !record.user.emailVerified) throw new Error();
      const consumed = await tx.authActionToken.deleteMany({ where: { id: record.id, expiresAt: { gt: new Date() } } });
      if (consumed.count !== 1) throw new Error();
      await tx.user.update({ where: { id: record.userId }, data: { password: passwordHash, passwordChangedAt: new Date(), loginAttemptCount: 0, lockUntil: null } });
      await tx.session.updateMany({ where: { userId: record.userId }, data: { revoked: true } });
      await tx.authActionToken.deleteMany({ where: { userId: record.userId, purpose: 'reset' } });
    });
    return clearAuthCookies(NextResponse.json({ success: true }));
  } catch { return NextResponse.json({ success: false, error: 'This reset link is invalid or expired. Request a new link.' }, { status: 400 }); }
}

export const PUT = withRateLimit(reset, { endpoint: "auth-reset" });
