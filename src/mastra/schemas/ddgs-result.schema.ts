import { z } from 'zod';

/***
 * {results: [{title: string, snippet: string, link: string}]}
 *
 */

export const DDGSResultSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      snippet: z.string(),
      link: z.string(),
    }),
  ),
});
