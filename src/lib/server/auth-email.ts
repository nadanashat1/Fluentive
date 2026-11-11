import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const validEmail = (value: unknown): value is string => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const validPassword = (value: unknown): value is string => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72 && !/^\$2[aby]\$/.test(value);

// Persistent atomic counters shared across serverless instances. No raw IP/email stored.
export async function allowAuthEmail(request: Request, email: string) {
  const now = Date.now();
  const hour = Math.floor(now / 3600000), day = Math.floor(now / 86400000);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const keys: [string, number][] = [[`email:${digest(email)}:${hour}`, 3], [`ip:${digest(ip)}:${hour}`, 10], [`global:${day}`, 100]];
  await prisma.authEmailRate.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const counts = await prisma.$transaction(keys.map(([id]) => prisma.authEmailRate.upsert({ where: { id }, create: { id, expiresAt: new Date(now + 86400000) }, update: { count: { increment: 1 } } })));
  return counts.every((value, i) => value.count <= keys[i][1]);
}

export async function sendAuthEmail(userId: string, email: string, purpose: 'verify' | 'reset') {
  const key = process.env.MAILJET_API_KEY, secret = process.env.MAILJET_SECRET_KEY;
  const origin = process.env.AUTH_APP_URL;
  if (!key || !secret || !origin || !origin.startsWith('https://')) throw new Error('Auth email not configured');
  const token = randomBytes(32).toString('hex');
  const tokenHash = digest(token);
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    await tx.authActionToken.deleteMany({ where: { userId, purpose } });
    await tx.authActionToken.create({ data: { userId, purpose, tokenHash, expiresAt: new Date(Date.now() + (purpose === 'verify' ? 24 * 3600000 : 30 * 60000)) } });
  });
  const url = new URL(purpose === 'verify' ? '/verify-email' : `/reset-password/${token}`, origin);
  if (purpose === 'verify') url.searchParams.set('token', token);
  const subject = purpose === 'verify' ? 'Verify your Fluentive demo email' : 'Reset your Fluentive demo password';
  const text = purpose === 'verify'
    ? `You requested a Fluentive demo account. Verify your email using this link within 24 hours:\n${url}\n\nIf you did not request this, ignore this email. Use synthetic test data only in the demo.`
    : `You requested a password reset for your Fluentive demo account. Choose a new password using this link within 30 minutes:\n${url}\n\nIf you did not request this, ignore this email. Your password will not change unless you complete the reset.`;
  try {
    const response = await fetch('https://api.mailjet.com/v3.1/send', { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ Messages: [{ From: { Email: 'nadanashat15@gmail.com', Name: 'Fluentive Demo' }, To: [{ Email: email }], Subject: subject, TextPart: text, TrackOpens: 'disabled', TrackClicks: 'disabled' }] }), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok || result.Messages?.[0]?.Status !== 'success') throw new Error('Delivery rejected');
  } catch {
    await prisma.authActionToken.deleteMany({ where: { tokenHash } });
    throw new Error('Auth email delivery failed');
  }
}
