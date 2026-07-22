// Enterprise-grade Zod validation schemas for API endpoints
// Provides strict validation for all API inputs and outputs

import { z } from 'zod';
import { DEAL_STAGES, DealStage } from '@/lib/constants/deal-stages';
import { DealStageSchema } from './deal-schemas';

// Base schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export const SearchSchema = z.object({
  search: z.string().trim().max(255).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional(),
  pipelineStage: z.string().trim().max(100).optional(),
  source: z.string().trim().max(100).optional(),
  course: z.string().trim().max(100).optional()
});

export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

// Raw DateRange schema for extending
export const RawDateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

// Lead schemas
export const LeadCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email format").optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  company: z.string().trim().max(255).optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).default('NEW'),
  pipelineStage: z.string().trim().max(100).default('New Lead'),
  course: z.string().trim().max(100).optional().nullable(),
  source: z.string().trim().max(100).optional(),
  estimatedValue: z.coerce.number().min(0).optional().default(0),
  tags: z.array(z.string()).optional().default([]),
  nextFollowUp: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(1000).optional()
});

export const LeadUpdateSchema = LeadCreateSchema.partial().extend({
  id: z.string().uuid("Invalid lead ID")
});

export const LeadListQuerySchema = PaginationSchema.merge(SearchSchema);

// Lead stats schemas
export const LeadStatsQuerySchema = RawDateRangeSchema.extend({
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  metric: z.enum(['count', 'value', 'conversion_rate']).default('count')
});

// User schemas
export const UserCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'MARKETING']).default('SALES_REP'),
  organization: z.string().trim().max(255).optional()
});

export const UserUpdateSchema = UserCreateSchema.partial().extend({
  id: z.string().uuid("Invalid user ID")
}).omit({ password: true });

export const UserPasswordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = UserCreateSchema.pick({
  name: true,
  email: true,
  password: true
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
});

// Organization schemas
export const OrganizationCreateSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(255),
  domain: z.string().trim().max(100).optional(),
  settings: z.object({
    maxUsers: z.coerce.number().min(1).default(10),
    features: z.array(z.string()).default([])
  }).optional()
});

export const OrganizationUpdateSchema = OrganizationCreateSchema.partial().extend({
  id: z.string().uuid("Invalid organization ID")
});

// Analytics schemas
export const AnalyticsQuerySchema = RawDateRangeSchema.extend({
  metrics: z.array(z.enum(['leads', 'deals', 'revenue', 'users', 'activities'])).default(['leads']),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  compareWith: z.enum(['previous_period', 'previous_year', 'none']).default('none')
});

// Activity schemas
export const ActivityCreateSchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'STATUS_CHANGE', 'FOLLOW_UP', 'SYSTEM']),
  description: z.string().trim().max(1000).optional(),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  userId: z.string().uuid().optional()
});

export const ActivityListQuerySchema = PaginationSchema.extend({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task']).optional(),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  completed: z.coerce.boolean().optional()
}).merge(RawDateRangeSchema);

// Deal schemas using reusable DealStageSchema
export const DealCreateSchema = z.object({
  title: z.string().trim().min(1, "Deal title is required").max(255),
  leadId: z.string().uuid("Invalid lead ID").optional().nullable(),
  value: z.coerce.number().min(0).default(0),
  stage: DealStageSchema.default('DISCOVERY' as DealStage),
  probability: z.coerce.number().min(0).max(100).default(0),
  expectedCloseDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  clientName: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
});

export const DealUpdateSchema = DealCreateSchema.partial().extend({
  id: z.string().uuid("Invalid deal ID")
});

export const DealListQuerySchema = PaginationSchema.extend({
  stage: DealStageSchema.optional(),
  leadId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(255).optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'value']).optional(),
  order: z.enum(['asc', 'desc']).optional()
}).merge(RawDateRangeSchema).refine((data) => {
  if (data.minValue !== undefined && data.maxValue !== undefined && data.minValue > data.maxValue) {
    return {
      message: "minValue cannot be greater than maxValue",
      path: ["minValue"]
    };
  }
  return true;
});

// Response schemas (for output validation)
export const LeadResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  position: z.string().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']),
  source: z.string().nullable(),
  course: z.string().nullable(),
  notes: z.string().nullable(),
  value: z.number().nullable(),
  expectedCloseDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  assignedUserId: z.string().nullable()
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['USER', 'SALES', 'MANAGER', 'ADMIN']),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  organizationId: z.string().nullable()
});

export const PaginatedLeadResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(LeadResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean()
  }),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    version: z.string()
  })
});

export const StatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    total: z.number(),
    byStatus: z.record(z.number()),
    bySource: z.record(z.number()),
    trends: z.array(z.object({
      date: z.string(),
      count: z.number(),
      value: z.number().optional()
    }))
  }),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    version: z.string()
  })
});

// Export all schemas for easy importing
export const Schemas = {
  // Lead schemas
  LeadCreate: LeadCreateSchema,
  LeadUpdate: LeadUpdateSchema,
  LeadListQuery: LeadListQuerySchema,
  LeadResponse: LeadResponseSchema,
  LeadStatsQuery: LeadStatsQuerySchema,
  
  // User schemas
  UserCreate: UserCreateSchema,
  UserUpdate: UserUpdateSchema,
  UserPasswordUpdate: UserPasswordUpdateSchema,
  UserResponse: UserResponseSchema,
  
  // Auth schemas
  Login: LoginSchema,
  Register: RegisterSchema,
  RefreshToken: RefreshTokenSchema,
  ForgotPassword: ForgotPasswordSchema,
  ResetPassword: ResetPasswordSchema,
  
  // Organization schemas
  OrganizationCreate: OrganizationCreateSchema,
  OrganizationUpdate: OrganizationUpdateSchema,
  
  // Analytics schemas
  AnalyticsQuery: AnalyticsQuerySchema,
  
  // Activity schemas
  ActivityCreate: ActivityCreateSchema,
  ActivityListQuery: ActivityListQuerySchema,
  
  // Deal schemas
  DealCreate: DealCreateSchema,
  DealUpdate: DealUpdateSchema,
  DealListQuery: DealListQuerySchema,
  
  // Response schemas
  PaginatedLeadResponse: PaginatedLeadResponseSchema,
  StatsResponse: StatsResponseSchema,
  
  // Base schemas
  Pagination: PaginationSchema,
  Search: SearchSchema,
  DateRange: DateRangeSchema
};

export default Schemas;
