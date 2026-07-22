export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(user: any): PublicUser | null {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function sanitizeUserResponse(user: any): { success: boolean; user?: PublicUser; message?: string } {
  const publicUser = toPublicUser(user);
  
  if (!publicUser) {
    return { success: false, message: "User not found" };
  }
  
  return { success: true, user: publicUser };
}
