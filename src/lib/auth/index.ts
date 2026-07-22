// Stripe-style minimal auth exports

// Core auth service - single authority
export { 
  authService,
  type AuthState,
  type User 
} from './auth.service';

// React hook - thin binding only
export { 
  useAuth,
  AuthProvider 
} from './useAuth';

// Transport layer - pure HTTP
export { HttpError } from '../api-client';
