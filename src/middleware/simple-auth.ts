// Simple Auth Middleware - Auth ONLY, no business logic
import { NextRequest, NextResponse } from 'next/server';
import { Roles, RoleType } from '@/constants/roles';


export interface UserContext {
  id: string;
  role: string;
  organization?: string;
}

// Simple auth middleware - ONLY extracts user
export async function withSimpleAuth(
  request: NextRequest,
  handler: (user: UserContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get user from auth system (simplified)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return await handler(user);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { success: false, error: 'Auth error' },
      { status: 500 }
    );
  }
}

// Simple auth helper
async function getUserFromRequest(request: NextRequest): Promise<UserContext | null> {
  // This would use your existing auth system
  // For now, return a placeholder
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Simple token validation (would use real JWT validation)
  if (authHeader === 'Bearer valid-token') {
    return {
      id: 'user-123',
      role: Roles.ADMIN,
      organization: 'default-tenant'
    };
  }

  return null;
}
