import crypto from 'crypto';

// Hash refresh token for storage (SHA-256 + salt)
export function hashRefreshToken(token: string): string {
  const salt = process.env.JWT_SECRET || 'default-salt';
  return crypto.createHash('sha256').update(token + salt).digest('hex');
}

// Verify refresh token against stored hash (timing-safe)
export function verifyRefreshToken(token: string, hash: string): boolean {
  const tokenHash = hashRefreshToken(token);
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}
