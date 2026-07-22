"use client";

/**
 * AuthRefresh - Previously fired a POST /api/auth/refresh on every mount.
 * This is now handled by the AuthKernel's bootstrapSession() in AuthContext-v2,
 * so this component is a no-op to prevent duplicate 401 calls on page load.
 */
export function AuthRefresh() {
  return null;
}
