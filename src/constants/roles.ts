export const Roles = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  MARKETING: 'marketing',
  HR: 'hr',
  FINANCE: 'finance',
  INSTRUCTOR: 'instructor',
  EMPLOYEE: 'employee',
  USER: 'user',
  SUPER_ADMIN: 'super_admin',
} as const;

export type RoleType = typeof Roles[keyof typeof Roles];
