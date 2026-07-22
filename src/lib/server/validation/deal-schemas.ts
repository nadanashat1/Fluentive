// Reusable Deal Stage Schemas
// Single source of truth for all DealStage validation
// Prevents duplication and ensures consistency across all layers

import { z } from 'zod';
import { DEAL_STAGES, DealStage } from '@/lib/constants/deal-stages';

// Base Deal Stage Schema (reusable everywhere)
export const DealStageSchema = z.string()
  .transform((val) => val.trim().toUpperCase())
  .pipe(z.enum(DEAL_STAGES, { 
    errorMap: () => ({ 
      message: `Invalid deal stage. Allowed: ${DEAL_STAGES.join(', ')}` 
    })
  }));

// Deal schemas using the reusable schema
export const DealCreateSchema = z.object({
  title: z.string().trim().min(1, "Deal title is required").max(255),
  leadId: z.string().uuid("Lead ID is required"),
  value: z.coerce.number().min(0),
  stage: DealStageSchema.default('OPEN' as DealStage),
  probability: z.coerce.number().min(0).max(100).default(0),
  expectedCloseDate: z.coerce.date().optional(),
  description: z.string().trim().max(1000).optional()
});

export const DealUpdateSchema = DealCreateSchema.partial().extend({
  id: z.string().uuid("Invalid deal ID")
});

export const DealListQuerySchema = z.object({
  stage: DealStageSchema.optional(),
  leadId: z.string().uuid().optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional()
});
