import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validEmail, allowAuthEmail, sendAuthEmail } from '@/lib/server/auth-email';
export async function POST(request: Request) {
  const response = () => NextResponse.json({ success: true, message: 'If an eligible account exists, a reset link has been sent.' });
  try {
    const { email } = await request.json();
    if (!validEmail(email)) return response();
    const normalized = email.toLowerCase().trim();
    if (!await allowAuthEmail(request, normalized)) return response();
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (user && user.isActive && !user.isDeleted && user.emailVerified) await sendAuthEmail(user.id, normalized, 'reset');
  } catch { /* Do not expose account existence or delivery status. */ }
  return response();
}
