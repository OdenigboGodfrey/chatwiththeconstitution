import { z } from 'zod';

export const QueryVectorEmbeddingSchema = z.object({
  code: z.string(),
  message: z.string(),
  status: z.boolean(),
  data: z.string(),
});
