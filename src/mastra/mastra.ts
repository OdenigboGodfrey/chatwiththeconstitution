import { Mastra } from '@mastra/core';
import { AGENT_ID } from './../shared/enums/agentid.enums';
import { ragOllamaAgent } from './agents/rag-ollama.agent';
import { ragOpenAIAgent } from './agents/rag-openai.agent';

export const mastra = new Mastra({
  agents: {
    [AGENT_ID.OLLAMA_RAG_AGENT]: ragOllamaAgent,
    [AGENT_ID.OPENAI_RAG_AGENT]: ragOpenAIAgent,
  },
  backgroundTasks: {
    enabled: true,
    defaultTimeoutMs: 600_000,
    waitTimeoutMs: 120_000,
  },
});
