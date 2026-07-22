// === AUTH TYPE CONTRACTS ===
// Stable domain types - never change without version bump

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export type AuthState = 'anonymous' | 'hydrating' | 'authenticated' | 'refreshing' | 'expired' | 'error';

export type AuthEvent = 'bootstrap' | 'login_success' | 'token_refresh_success' | 'session_expired' | 'logout' | 'network_error';

export type AuthKernelState = {
  status: AuthState;
  user: User | null;
  version: number;
};
