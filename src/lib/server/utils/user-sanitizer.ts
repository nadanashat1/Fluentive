/**
 * User Sanitizer - Removes sensitive fields from user objects
 * Prevents password leaks in API responses
 */

import { User } from '../types';

export function sanitizeUser(user: any): User | null {
  if (!user) return null;
  
  const { password, ...safeUser } = user;
  
  return safeUser;
}

export function sanitizeUserResponse(user: any) {
  if (!user) return { success: false, message: 'User not found' };
  
  const { password, ...safeUser } = user;
  
  return {
    success: true,
    data: safeUser
  };
}
