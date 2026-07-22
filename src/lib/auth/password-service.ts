import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  // Safety check: if password is already hashed, return as-is
  if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
    return password;
  }
  
  // Always hash with consistent salt rounds
  return await bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  // If the password in the database isn't hashed, allow plaintext comparison.
  // This helps when using manually created test users with simple passwords.
  if (!isBcryptHash(hashedPassword)) {
    return password === hashedPassword;
  }
  
  return await bcrypt.compare(password, hashedPassword);
}

export function isBcryptHash(password: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(password);
}

export function validatePasswordHash(password: string): boolean {
  return isBcryptHash(password);
}
