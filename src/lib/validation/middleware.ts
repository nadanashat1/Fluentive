import { ZodSchema, ZodError } from 'zod';
import { createErrorResponse } from '@/lib/api/contracts';

// Validation middleware for API routes
export function validateRequestBody<T>(schema: ZodSchema<T>) {
  return async (request: Request): Promise<{ data: T; error?: Response }> => {
    try {
      const body = await request.json();
      const data = schema.parse(body);
      return { data };
    } catch (error) {
      if (error instanceof ZodError && error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => {
          if (err && err.path && Array.isArray(err.path)) {
            return `${err.path.join('.')}: ${err.message || 'Unknown error'}`;
          }
          return err.message || 'Unknown error';
        }).join(', ');
        return {
          data: {} as T,
          error: Response.json(
            createErrorResponse(`Validation failed: ${errorMessages}`),
            { status: 400 }
          )
        };
      }
      
      return {
        data: {} as T,
        error: Response.json(
          createErrorResponse('Invalid request body'),
          { status: 400 }
        )
      };
    }
  };
}

// Validation middleware for query parameters
export function validateQueryParams<T>(schema: ZodSchema<T>) {
  return (url: URL): { data: T; error?: Response } => {
    try {
      const params: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        if (typeof key === 'string' && typeof value === 'string') {
          params[key] = value;
        }
      });
      
      const data = schema.parse(params);
      return { data };
    } catch (error) {
      if (error instanceof ZodError && error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => {
          if (err && err.path && Array.isArray(err.path)) {
            return `${err.path.join('.')}: ${err.message || 'Unknown error'}`;
          }
          return err.message || 'Unknown error';
        }).join(', ');
        return {
          data: {} as T,
          error: Response.json(
            createErrorResponse(`Query validation failed: ${errorMessages}`),
            { status: 400 }
          )
        };
      }
      
      return {
        data: {} as T,
        error: Response.json(
          createErrorResponse('Invalid query parameters'),
          { status: 400 }
        )
      };
    }
  };
}

// Common query schemas
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
});

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
