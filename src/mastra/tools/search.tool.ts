import { createTool } from '@mastra/core/tools';
import { TOOL_ID } from 'src/shared/enums/toolid.enums';
import { z } from 'zod';
import { DDGSResultSchema } from '../schemas/ddgs-result.schema';
import { DDGSResultItemDTO } from '../dtos/ddgs-result.dto';
import { tavilySearch } from '../utils/tavily.utils';

export const duckduckgoSearchTool = createTool({
  id: TOOL_ID.SEARCH_TOOL,
  description: 'Searches the web to get up-to-date information on topics.',
  inputSchema: z.object({
    query: z.string().describe('The search query to look up on the web'),
  }),
  outputSchema: DDGSResultSchema,
  execute: async ({ query }) => {
    console.log('using search tool', query);
    try {
      const results: DDGSResultItemDTO[] = [];
      const MAX_RETRIES = 3;
      for (let i = 0; i < MAX_RETRIES; i++) {
        const response = await tavilySearch(query);
        // console.log('search response:', query, response);

        if (response == null) {
          return {
            results: [
              {
                title: 'Error',
                snippet:
                  'Search temporarily ran into issues. Please try again shortly.',
                link: '',
                content: '',
              },
            ],
          };
        }

        for (let i = 0; i < response.length; i++) {
          results.push({
            title: response[i].title || '',
            snippet: response[i].snippet || '',
            link: response[i].url || '',
            content: response[i].content || '',
          });
        }

        if (results.length > 0) {
          // console.log('search tool response', results);
          return { results };
        }
        console.log('No results found. Retrying...');
      }
    } catch (error) {
      console.error('search Tool Error:', error);
      return { results: [] };
    }
  },
});
