import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { digest } from '@/lib/server/auth-email';
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error();
    await prisma.$transaction(async tx => {
      const record = await tx.authActionToken.findUnique({ where: { tokenHash: digest(token) }, include: { user: true } });
      if (!record || record.purpose !== 'verify' || record.expiresAt < new Date() || record.user.isDeleted || !record.user.isActive) throw new Error();
      const consumed = await tx.authActionToken.deleteMany({ where: { id: record.id, expiresAt: { gt: new Date() } } });
      if (consumed.count !== 1) throw new Error();
      await tx.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: 'This verification link is invalid or expired. Register again to resend it.' }, { status: 400 }); }
}
