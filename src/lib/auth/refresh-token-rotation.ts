// Refresh Token Rotation - Secure, Single-Use System
// Implements enterprise-grade session management

import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export class RefreshTokenRotation {
  // Generate a unique refresh token with rotation tracking
  static async generateRefreshToken(userId: string): Promise<string> {
    const tokenId = crypto.randomUUID();
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET is missing in environment variables');
    }

    const payload: RefreshTokenPayload = {
      userId,
      tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    const refreshToken = jwt.sign(payload, secret);
    
    // Store token metadata for rotation tracking
    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        token: refreshToken,
        expiresAt: new Date(payload.exp * 1000),
        isUsed: false
      }
    });

    return refreshToken;
  }

  // Validate and rotate refresh token (single-use)
  static async validateAndRotate(refreshToken: string): Promise<{
    userId: string;
    newRefreshToken: string;
    accessToken: string;
  }> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is missing in environment variables');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(refreshToken, secret) as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    // Check if token exists and is not used
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId }
    });

    if (!storedToken || storedToken.isUsed || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Mark old token as used (single-use)
    await prisma.refreshToken.update({
      where: { id: payload.tokenId },
      data: { isUsed: true }
    });

    // Generate new tokens
    const newRefreshToken = await this.generateRefreshToken(payload.userId);
    const accessToken = jwt.sign(
      { id: payload.userId, email: '', role: '' }, // Will be populated from DB
      secret,
      { expiresIn: '15m' }
    );

    return {
      userId: payload.userId,
      newRefreshToken,
      accessToken
    };
  }

  // Revoke all refresh tokens for a user
  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isUsed: true }
    });
  }

  // Clean up expired tokens
  static async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
  }
}
