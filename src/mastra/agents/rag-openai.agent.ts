import { Agent } from '@mastra/core/agent';
import { AGENT_ID } from '../../shared/enums/agentid.enums';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { RAG_PROMPT } from './prompt';
import { TOOL_ID } from 'src/shared/enums/toolid.enums';
import { vectorQueryTool } from '../tools/rag.tools';
import { duckduckgoSearchTool } from '../tools/search.tool';

const model = createOpenAICompatible({
  name: 'nvidia',
  baseURL: process.env.LLM_HOST!,
  apiKey: process.env.LLM_API_KEY!,
});

export const ragOpenAIAgent = new Agent({
  id: AGENT_ID.OPENAI_RAG_AGENT,
  name: 'Nigerian Constitution AI RAG Agent Using a Remote LLM',
  description:
    'RAG Agent for Nigerian Constitution with access to a query tool for database vector searches and a DuckDuckGo search tool for up-to-date information.',
  instructions: RAG_PROMPT,
  model: model(process.env.LARGE_LANGUAGE_MODEL!),
  tools: {
    [TOOL_ID.RAG_TOOL]: vectorQueryTool,
    [TOOL_ID.SEARCH_TOOL]: duckduckgoSearchTool,
  },
});
