import jwt from 'jsonwebtoken';
import { toPublicUser } from './user-serialization';
import { createAuthResponse } from './cookies';

export function buildAuthResponse(dbUser: any, token: string) {
  return {
    user: toPublicUser(dbUser),
    token,
  };
}

export function buildAuthResponseWithRefresh(dbUser: any, token: string) {
  return {
    user: toPublicUser(dbUser),
    token,
    refreshToken: token, // Simple implementation for now
  };
}

export function createJWT(dbUser: any): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { id: dbUser.id, email: dbUser.email, role: dbUser.role },
    jwtSecret,
    { expiresIn: '30d' }
  );
}

export function buildSuccessAuthResponse(dbUser: any) {
  const token = createJWT(dbUser);
  return buildAuthResponse(dbUser, token);
}

export function buildSuccessAuthResponseWithRefresh(dbUser: any) {
  const token = createJWT(dbUser);
  return buildAuthResponseWithRefresh(dbUser, token);
}
