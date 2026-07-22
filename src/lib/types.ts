// User type definition for authentication system

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  ADMIN: 'ADMIN';
  SALES: 'SALES';
  MANAGER: 'MANAGER';
  USER: 'USER';
}
