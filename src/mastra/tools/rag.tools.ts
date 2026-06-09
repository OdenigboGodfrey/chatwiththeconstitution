import { createTool } from '@mastra/core/tools';
import { TOOL_ID } from 'src/shared/enums/toolid.enums';
import { z } from 'zod';
import { queryVectorEmbeddings } from '../utils/helpers.utils';
import { QueryVectorEmbeddingSchema } from '../schemas/query-vector-emebedding.schema';
import { INDEX_NAME } from 'src/shared/enums/index-name.enums';
import { generateIndexName } from 'src/shared/utils/generate-index-name.util';

export const vectorQueryTool = createTool({
  id: TOOL_ID.RAG_TOOL,
  description: 'Query the vector datastore using a string based query.',
  inputSchema: z.object({
    query: z.any().describe('String based RAG Query'),
  }),
  outputSchema: QueryVectorEmbeddingSchema,
  execute: async ({ query }) => {
    console.log('using tool for rag query', query);
    try {
      const result = await queryVectorEmbeddings(
        generateIndexName(INDEX_NAME.CHAT_WITH_THE_CONSTITUTION),
        JSON.stringify(query),
      );
      return result;
    } catch (error) {
      console.error('Rag Query Tool Error:', error);
    }
  },
});
