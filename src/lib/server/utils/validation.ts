// Enterprise-grade input validation using Zod
// Prevents injection attacks and ensures data integrity

import { z } from 'zod';

// Common validation schemas
export const schemas = {
  // Email validation
  email: z.string().email('Invalid email format').min(5).max(255),
  
  // Password validation (min 8 chars, at least 1 number, 1 uppercase, 1 lowercase)
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  
  // Name validation
  name: z.string().min(2).max(100).trim(),
  
  // UUID validation
  uuid: z.string().uuid(),
  
  // Lead status
  leadStatus: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost']),
  
  // Deal stage
  dealStage: z.enum(['qualification', 'meeting', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  
  // Priority
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  
  // Search query
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

// Validate request body
export function validateBody<T>(schema: z.ZodType<T>, body: unknown): { 
  success: true; 
  data: T;
} | { 
  success: false; 
  errors: string[];
} {
  const result = schema.safeParse(body);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((issue) => 
    `${issue.path.join('.')}: ${issue.message}`
  );
  
  return { success: false, errors };
}

// Validate query parameters
export function validateQuery<T>(schema: z.ZodType<T>, query: Record<string, string | string[]>): {
  success: true;
  data: T;
} | {
  success: false;
  errors: string[];
} {
  // Convert array values to single values where appropriate
  const normalized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value) && value.length === 1) {
      normalized[key] = value[0];
    } else {
      normalized[key] = value;
    }
  }
  
  return validateBody(schema, normalized);
}

// Sanitize string (prevent XSS)
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .slice(0, 1000); // Max length
}

// Sanitize HTML content (if needed for rich text)
export function sanitizeHtml(input: string): string {
  // Basic sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 5000);
}
