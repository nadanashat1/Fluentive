import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { User } from '../types';

// Use type assertion to bypass TypeScript errors temporarily
const prismaClient = prisma as any;

const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE_DAYS = 7;
const REMEMBER_ME_EXPIRE_DAYS = 7; // Changed from 30 to 7 for consistency

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export const sendTokenResponse = (
  user: User,
  rememberMe: boolean = false
): { user: any; token: string; refreshToken: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing in environment variables');
  }
  
  // Create access token
  const accessToken = jwt.sign({ id: user.id }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRE
  });

  // Create refresh token (JWT format for compatibility)
  const refreshTokenExpiryDays = rememberMe ? REMEMBER_ME_EXPIRE_DAYS : REFRESH_TOKEN_EXPIRE_DAYS;
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    secret,
    { expiresIn: `${refreshTokenExpiryDays}d` }
  );

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: accessToken,
    refreshToken
  };
};

export const register = async (data: { name: string; email: string; password: string; role?: string }) => {
  const { name, email, password, role = 'sales' } = data;

  // Check if user exists
  const existingUser = await prismaClient.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password (consistent with other auth flows - 12 rounds)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Find or create default organization to prevent duplication
  let organization = await prismaClient.organization.findFirst({
    where: { name: "Default" }
  });
  
  if (!organization) {
    organization = await prismaClient.organization.create({
      data: {
        name: "Default",
        slug: `default-${Date.now()}`,
        subscriptionTier: 'FREE'
      }
    });
  }

  // Create user with organization
  const user = await prismaClient.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role as any,
      organizationId: organization.id
    }
  });

  return sendTokenResponse(user);
};

export const login = async (data: { email: string; password: string; rememberMe?: boolean }) => {
  const { email, password, rememberMe = false } = data;

  // Find user
  const user = await prismaClient.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password with bcrypt
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return sendTokenResponse(user, rememberMe);
};

export const getMe = async (userId: string) => {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
