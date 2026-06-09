import { Agent } from '@mastra/core/agent';
import { AGENT_ID } from '../../shared/enums/agentid.enums';
import { createOllama } from 'ollama-ai-provider-v2';
import { RAG_PROMPT } from './prompt';
import { TOOL_ID } from 'src/shared/enums/toolid.enums';
import { vectorQueryTool } from '../tools/rag.tools';
import { duckduckgoSearchTool } from '../tools/search.tool';

const ollama = createOllama({
  baseURL: process.env.LLM_HOST!,
});

export const ragOllamaAgent = new Agent({
  id: AGENT_ID.OLLAMA_RAG_AGENT,
  name: 'Nigerian Constitution AI RAG Agent using a local Ollama instance',
  description:
    'RAG Agent for Nigerian Constitution with access to a query tool for database vector searches and a DuckDuckGo search tool for up-to-date information.',
  instructions: RAG_PROMPT,
  model: ollama(process.env.LARGE_LANGUAGE_MODEL!),
  tools: {
    [TOOL_ID.RAG_TOOL]: vectorQueryTool,
    [TOOL_ID.SEARCH_TOOL]: duckduckgoSearchTool,
  },
});
