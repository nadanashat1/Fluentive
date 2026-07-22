// Authentication Service - Handles user authentication and authorization

import { useState, useEffect } from 'react';
import { apiService, ApiResponse } from './apiService';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  permissions?: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequestData {
  email: string;
  newPassword: string;
  token: string;
}

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeFromStorage();
  }

  // Initialize auth state from localStorage
  private initializeFromStorage(): void {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');
      const storedUser = localStorage.getItem('current_user');
      const storedExpiry = localStorage.getItem('token_expiry');

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.refreshToken = storedRefreshToken;
        this.tokenExpiry = storedExpiry ? parseInt(storedExpiry) : null;
        this.currentUser = JSON.parse(storedUser);
        
        // Set API service token
        apiService.setAuthToken(storedToken);
        
        // Start refresh timer if token has expiry
        if (this.tokenExpiry) {
          this.startTokenRefreshTimer();
        }
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      this.clearAuthData();
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiService.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.success && response.data) {
        await this.handleAuthSuccess(response.data, credentials.rememberMe);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiService.post<AuthResponse>('/api/auth/register', userData);
      
      if (response.success && response.data) {
        await this.handleAuthSuccess(response.data, true);
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiService.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Refresh access token
  async refreshToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<AuthResponse>('/api/auth/refresh', {
        refreshToken: this.refreshToken
      });

      if (response.success && response.data) {
        await this.handleAuthSuccess(response.data, true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      return false;
    }
  }

  // Handle successful authentication
  private async handleAuthSuccess(authData: AuthResponse, rememberMe: boolean = false): Promise<void> {
    this.currentUser = authData.user;
    this.token = authData.token;
    this.refreshToken = authData.refreshToken;
    this.tokenExpiry = Date.now() + (authData.expiresIn * 1000);

    // Store in localStorage
    if (rememberMe) {
      localStorage.setItem('auth_token', authData.token);
      localStorage.setItem('refresh_token', authData.refreshToken);
      localStorage.setItem('current_user', JSON.stringify(authData.user));
      localStorage.setItem('token_expiry', this.tokenExpiry.toString());
    } else {
      // Use sessionStorage for non-persistent login
      sessionStorage.setItem('auth_token', authData.token);
      sessionStorage.setItem('refresh_token', authData.refreshToken);
      sessionStorage.setItem('current_user', JSON.stringify(authData.user));
      sessionStorage.setItem('token_expiry', this.tokenExpiry.toString());
    }

    // Set API service token
    apiService.setAuthToken(authData.token);

    // Start refresh timer
    this.startTokenRefreshTimer();
  }

  // Start automatic token refresh timer
  private startTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (!this.tokenExpiry) {
      return;
    }

    // Refresh token 5 minutes before expiry
    const refreshTime = this.tokenExpiry - (5 * 60 * 1000);
    const timeUntilRefresh = refreshTime - Date.now();

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, timeUntilRefresh);
    } else {
      // Token is already expiring soon, refresh now
      this.refreshToken();
    }
  }

  // Clear authentication data
  private clearAuthData(): void {
    this.currentUser = null;
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    // Clear storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('token_expiry');
    
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('token_expiry');

    // Clear API service token
    apiService.removeAuthToken();

    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions?.includes(permission) || false;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('superadmin');
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await apiService.put<User>(`/api/users/${this.currentUser.id}`, userData);
      
      if (response.success && response.data) {
        this.currentUser = { ...this.currentUser, ...response.data };
        this.updateStoredUser();
      }
      
      return response;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      return await apiService.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.post('/api/auth/forgot-password', { email });
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(data: PasswordResetRequestData): Promise<ApiResponse<void>> {
    try {
      return await apiService.post('/api/auth/reset-password', data);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.post('/api/auth/verify-email', { token });
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Update stored user data
  private updateStoredUser(): void {
    if (this.currentUser) {
      localStorage.setItem('current_user', JSON.stringify(this.currentUser));
      sessionStorage.setItem('current_user', JSON.stringify(this.currentUser));
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    if (!this.tokenExpiry) {
      return false;
    }
    return Date.now() >= this.tokenExpiry;
  }

  // Get token expiry time
  getTokenExpiry(): number | null {
    return this.tokenExpiry;
  }

  // Force token refresh
  async forceTokenRefresh(): Promise<boolean> {
    return await this.refreshToken();
  }
}

// Create singleton instance
export const authService = new AuthService();

// React hook for authentication
export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setUser(authService.getCurrentUser());
      setIsAuthenticated(authService.isAuthenticated());
    };

    // Check auth state initially
    checkAuth();

    // Set up periodic check for token expiry
    const interval = setInterval(() => {
      if (authService.isTokenExpired()) {
        authService.refreshToken();
      }
      checkAuth();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(authService.getCurrentUser());
      setIsAuthenticated(authService.isAuthenticated());
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      setUser(authService.getCurrentUser());
      setIsAuthenticated(authService.isAuthenticated());
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    setIsLoading(true);
    try {
      const response = await authService.updateProfile(userData);
      setUser(authService.getCurrentUser());
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    hasRole: authService.hasRole.bind(authService),
    hasPermission: authService.hasPermission.bind(authService),
    isAdmin: authService.isAdmin.bind(authService),
    refreshToken: authService.refreshToken.bind(authService),
  };
}

// Export types
export type { User, LoginCredentials, RegisterData, AuthResponse, PasswordResetRequestData };
