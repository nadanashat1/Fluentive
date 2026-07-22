// Auth Service - Domain layer for authentication business logic
import { auth } from '@/lib/api';
import { LoginResponse, User } from '@/lib/schemas';
import { logAction, logError } from '@/lib/observability';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Auth service with business logic
export const authService = {
  // Login with business validation
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    logAction('auth.login', { email: credentials.email });
    
    // Business validation
    if (!credentials.email || typeof credentials.email !== 'string' || !credentials.email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    try {
      const response = await auth.login(credentials);
      
      if (response.success && response.data.token) {
        logAction('auth.login.success', { 
          userId: response.data.user.id,
          email: response.data.user.email 
        });
      }
      
      return response;
    } catch (error) {
      logError(error, { 
        operation: 'login',
        email: credentials.email 
      });
      throw error;
    }
  },

  // Register with business validation
  async register(data: RegisterData): Promise<LoginResponse> {
    logAction('auth.register', { email: data.email, name: data.name });
    
    // Business validation
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    
    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    
    if (!data.password || data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    try {
      const response = await auth.register(data);
      
      if (response.success && response.data.token) {
        logAction('auth.register.success', { 
          userId: response.data.user.id,
          email: response.data.user.email 
        });
      }
      
      return response;
    } catch (error) {
      logError(error, { 
        operation: 'register',
        email: data.email,
        name: data.name 
      });
      throw error;
    }
  },

  // Get current user with session validation
  async getCurrentUser(): Promise<User | null> {
    logAction('auth.getCurrentUser');
    
    try {
      const response = await auth.me();
      
      if (response) {
        logAction('auth.getCurrentUser.success', { 
          userId: response.id,
          email: response.email 
        });
      }
      
      return response;
    } catch (error) {
      logError(error, { 
        operation: 'getCurrentUser' 
      });
      return null;
    }
  },

  // Logout with cleanup
  async logout(): Promise<void> {
    logAction('auth.logout');
    
    try {
      await auth.logout();
      
      // Business logic: Clear session data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      logAction('auth.logout.success');
    } catch (error) {
      logError(error, { 
        operation: 'logout' 
      });
      // Still clear local data even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  // Change password with validation
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    logAction('auth.changePassword');
    
    // Business validation
    if (!data.currentPassword || data.currentPassword.length < 6) {
      throw new Error('Current password is required');
    }
    
    if (!data.newPassword || data.newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }
    
    if (data.currentPassword === data.newPassword) {
      throw new Error('New password must be different from current password');
    }
    
    try {
      await auth.changePassword(data);
      logAction('auth.changePassword.success');
    } catch (error) {
      logError(error, { 
        operation: 'changePassword' 
      });
      throw error;
    }
  }
};
