import { z } from 'zod';

// Base validation schemas
export const BaseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// User validation schemas
export const UserSchema = BaseSchema.extend({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'agent']),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  emailVerified: z.boolean(),
});

// Deal validation schemas
export const DealSchema = BaseSchema.extend({
  clientName: z.string().min(1).max(255),
  clientCompany: z.string().max(255).default(''),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  course: z.string().max(255).default(''),
  dealValue: z.number().min(0),
  stage: z.enum(['qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']),
  assigneeName: z.string().max(255).optional(),
  assigneeEmail: z.string().email().optional(),
  expectedCloseDate: z.string().datetime().optional(),
  probability: z.number().min(0).max(100).default(50),
});

// Lead validation schemas
export const LeadSchema = BaseSchema.extend({
  name: z.string().min(1).max(255),
  phone: z.string().min(1),
  email: z.string().email(),
  course: z.string().min(1),
  source: z.string().min(1),
  status: z.enum(['new', 'contacted', 'interested', 'converted', 'not-interested']).default('new'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  ownerId: z.string().uuid(),
  followUpDate: z.string().datetime().optional(),
  lastFollowUp: z.string().datetime().optional(),
});

// API Request schemas
export const CreateDealRequestSchema = DealSchema.pick({
  clientName: true,
  clientCompany: true,
  clientEmail: true,
  clientPhone: true,
  course: true,
  dealValue: true,
  stage: true,
  assigneeName: true,
  assigneeEmail: true,
  expectedCloseDate: true,
  probability: true,
});

export const UpdateDealRequestSchema = CreateDealRequestSchema.partial();

export const CreateLeadRequestSchema = LeadSchema.pick({
  name: true,
  phone: true,
  email: true,
  course: true,
  source: true,
  priority: true,
  followUpDate: true,
});

export const UpdateLeadRequestSchema = CreateLeadRequestSchema.partial();

// Auth schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterRequestSchema = LoginRequestSchema.extend({
  name: z.string().min(1).max(255),
  role: z.enum(['admin', 'manager', 'agent']).default('agent'),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

// Type exports
export type CreateDealRequest = z.infer<typeof CreateDealRequestSchema>;
export type UpdateDealRequest = z.infer<typeof UpdateDealRequestSchema>;
export type CreateLeadRequest = z.infer<typeof CreateLeadRequestSchema>;
export type UpdateLeadRequest = z.infer<typeof UpdateLeadRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
