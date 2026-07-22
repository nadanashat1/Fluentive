// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  organizationId?: string | null;
  subscriptionTier?: string;
  loginAttemptCount: number;
  lockUntil: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Lead Types
export interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
  course?: string;
  source?: string;
  status: string;
  photo?: string | null;
  aiScore?: number | null;
  priority?: string | null;
  lastFollowUp?: Date | null;
  nextFollowUp?: Date | null;
  assignedTo?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: LeadNote[];
  activityLogs?: ActivityLog[];
}

export interface LeadResponse {
  id: string;
  name: string;
  phone?: string;
  email?: string | null;
  course?: string;
  source?: string;
  status: string;
  photo?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  leadId?: string | null;
  userId?: string;
  action: string;
  details?: string | null;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Lead Note Types
export interface LeadNote {
  id: string;
  leadId?: string;
  authorId?: string;
  content: string;
  isImportant: boolean;
  createdAt: Date;
  updatedAt?: Date;
  author?: {
    name: string;
    email?: string;
  };
}

// Auth Types
export interface AuthPayload {
  id: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateDetailsRequest {
  name: string;
  email: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Error Types
export interface ErrorResponse {
  success: false;
  message: string;
  stack?: string;
}

// Stats Types
export interface Stats {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  newLeadsThisWeek: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  recentLeads: Lead[];
  activityLogs: ActivityLog[];
}
