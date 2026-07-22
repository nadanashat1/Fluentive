// Type-safe DTOs for all API responses
// Eliminates 'any' types and provides compile-time safety

import { z } from 'zod';
import { LeadStatus } from './LeadStatus';

// Base response wrapper
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional()
});

export type BaseResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// User DTOs
export const UserDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'MARKETING', 'SALES', 'sales', 'manager', 'admin', 'SALES_ADMIN_MANAGER']),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  organization: z.string().optional()
});

export type UserDto = z.infer<typeof UserDtoSchema>;

// Lead DTOs
export const LeadDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  status: z.nativeEnum(LeadStatus),
  pipelineStage: z.string().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  aiScore: z.number().optional().nullable(),
  source: z.string().optional().nullable(),
  tags: z.array(z.string()),
  userId: z.string().uuid(),
  owner: z.object({ name: z.string().optional().nullable() }).optional().nullable(),
  activities: z.array(z.any()).optional(),
  lastContactedAt: z.string().datetime().optional().nullable(),
  nextFollowUp: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type LeadDto = z.infer<typeof LeadDtoSchema>;

export const CreateLeadRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  pipelineStage: z.string().optional(),
  estimatedValue: z.number().optional(),
  tags: z.array(z.string()).optional()
});

export type CreateLeadRequest = z.infer<typeof CreateLeadRequestSchema>;

export const UpdateLeadRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  status: z.nativeEnum(LeadStatus).optional(),
  pipelineStage: z.string().optional(),
  estimatedValue: z.number().optional().nullable(),
  tags: z.array(z.string()).optional(),
  lastContactedAt: z.string().datetime().optional().nullable(),
  nextFollowUp: z.string().datetime().optional().nullable()
});

export type UpdateLeadRequest = z.infer<typeof UpdateLeadRequestSchema>;

// Deal DTOs
export const DealDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  value: z.number().nonnegative(),
  stage: z.enum(['OPEN', 'DISCOVERY', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  userId: z.string().uuid(),
  leadId: z.string().uuid().optional().nullable(),
  activities: z.array(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type DealDto = z.infer<typeof DealDtoSchema>;

export const CreateDealRequestSchema = z.object({
  title: z.string().min(1),
  value: z.number().nonnegative().optional(),
  leadId: z.string().uuid(),
  stage: z.enum(['OPEN', 'DISCOVERY', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional()
});

export type CreateDealRequest = z.infer<typeof CreateDealRequestSchema>;

// Dashboard DTOs
export const DashboardSummarySchema = z.object({
  totalLeads: z.number(),
  activeDeals: z.number(),
  pipelineValue: z.number(),
  conversionRate: z.number(),
  recentActivity: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    timestamp: z.string(),
    user: z.string().optional()
  }))
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

export const DashboardStatsSchema = z.object({
  leadsByStatus: z.array(z.object({ status: z.string(), count: z.number() })),
  revenueByMonth: z.array(z.object({ month: z.string(), revenue: z.number() })),
  pipelineByStage: z.array(z.object({ stage: z.string(), count: z.number(), value: z.number() })),
  topSalesReps: z.array(z.object({ name: z.string(), deals: z.number(), value: z.number() }))
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Activity DTOs
export const ActivityDtoSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'STATUS_CHANGE', 'FOLLOW_UP', 'SYSTEM']),
  description: z.string().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  createdAt: z.string().datetime()
});

export type ActivityDto = z.infer<typeof ActivityDtoSchema>;

// Notification DTOs
export const NotificationDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  isRead: z.boolean(),
  createdAt: z.string().datetime()
});

export type NotificationDto = z.infer<typeof NotificationDtoSchema>;

// API Response wrappers
export const UserResponseSchema = BaseResponseSchema.extend({
  data: UserDtoSchema.optional()
});

export type UserResponse = BaseResponse<UserDto>;

export const LeadListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    leads: z.array(LeadDtoSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number()
  })
});

export type LeadListResponse = BaseResponse<{
  leads: LeadDto[];
  total: number;
  page: number;
  limit: number;
}>;

export const LeadResponseSchema = BaseResponseSchema.extend({
  data: LeadDtoSchema.optional()
});

export type LeadResponse = BaseResponse<LeadDto>;

export const DealListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    deals: z.array(DealDtoSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    stats: z.object({
      totalValue: z.number(),
      count: z.number()
    }).optional()
  })
});

export type DealListResponse = BaseResponse<{
  deals: DealDto[];
  total: number;
  page: number;
  limit: number;
  stats?: {
    totalValue: number;
    count: number;
  };
}>;

export const DashboardSummaryResponseSchema = BaseResponseSchema.extend({
  data: DashboardSummarySchema.optional()
});

export type DashboardSummaryResponse = BaseResponse<DashboardSummary>;

export const DashboardStatsResponseSchema = BaseResponseSchema.extend({
  data: DashboardStatsSchema.optional()
});

export type DashboardStatsResponse = BaseResponse<DashboardStats>;

export const NotificationListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    notifications: z.array(NotificationDtoSchema),
    total: z.number(),
    unreadCount: z.number()
  })
});

export type NotificationListResponse = BaseResponse<{
  notifications: NotificationDto[];
  total: number;
  unreadCount: number;
}>;

export const DealResponseSchema = BaseResponseSchema.extend({
  data: DealDtoSchema.optional()
});

export type DealResponse = BaseResponse<DealDto>;

// Auth DTOs
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AuthResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    user: UserDtoSchema,
    token: z.string(),
    refreshToken: z.string()
  }).optional()
});

export type AuthResponse = BaseResponse<{
  user: UserDto;
  token: string;
  refreshToken: string;
}>;

// Query parameters types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface LeadFilters extends PaginationParams {
  search?: string;
  status?: LeadStatus;
  source?: string;
}

export interface DealFilters extends PaginationParams {
  search?: string;
  stage?: string;
  leadId?: string;
}

export interface ActivityFilters extends PaginationParams {
  type?: string;
  leadId?: string;
  dealId?: string;
}

// Export all schemas for validation
export const Schemas = {
  BaseResponse: BaseResponseSchema,
  User: UserDtoSchema,
  UserResponse: UserResponseSchema,
  Lead: LeadDtoSchema,
  LeadResponse: LeadResponseSchema,
  LeadListResponse: LeadListResponseSchema,
  CreateLead: CreateLeadRequestSchema,
  UpdateLead: UpdateLeadRequestSchema,
  Deal: DealDtoSchema,
  DealResponse: DealResponseSchema,
  DealListResponse: DealListResponseSchema,
  CreateDeal: CreateDealRequestSchema,
  DashboardSummary: DashboardSummarySchema,
  DashboardSummaryResponse: DashboardSummaryResponseSchema,
  DashboardStats: DashboardStatsSchema,
  DashboardStatsResponse: DashboardStatsResponseSchema,
  Activity: ActivityDtoSchema,
  Notification: NotificationDtoSchema,
  NotificationListResponse: NotificationListResponseSchema,
  Login: LoginRequestSchema,
  Register: RegisterRequestSchema,
  Auth: AuthResponseSchema,
  AuthResponse: AuthResponseSchema
};

