// API Schemas - Runtime validation with Zod
// TypeScript lies at runtime, APIs break - this prevents silent bugs

import { z } from 'zod';


// Auth schemas
export const LoginResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    token: z.string(),
    refreshToken: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
    }),
  }),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// Lead schemas
export const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  value: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LeadListSchema = z.object({
  success: z.boolean(),
  data: z.array(LeadSchema),
});

// Dashboard schemas
export const DashboardSummarySchema = z.object({
  success: z.boolean(),
  data: z.object({
    totalLeads: z.number(),
    activeDeals: z.number(),
    revenue: z.number(),
    conversionRate: z.number(),
  }),
});

// Deal schemas
export const DealSchema = z.object({
  id: z.string(),
  name: z.string(),
  leadId: z.string(),
  value: z.number(),
  stage: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Notification schemas
export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const NotificationListSchema = z.object({
  success: z.boolean(),
  data: z.array(NotificationSchema),
});

// Error schema
export const ApiErrorSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  code: z.string().optional(),
});

// Export types
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type LeadList = z.infer<typeof LeadListSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type Deal = z.infer<typeof DealSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationList = z.infer<typeof NotificationListSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
