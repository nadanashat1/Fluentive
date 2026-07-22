import { z } from 'zod';

import { DealListQuerySchema } from '@/lib/server/validation/schemas';

export type DealListQuery = z.infer<typeof DealListQuerySchema>;
