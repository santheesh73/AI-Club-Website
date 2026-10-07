import { z } from 'zod';

export const generateInsightSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '12m', 'all']).default('30d'),
  forceRefresh: z.boolean().optional().default(false),
});
