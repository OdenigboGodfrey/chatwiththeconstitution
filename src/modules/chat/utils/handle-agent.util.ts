import { ResponseDTO } from 'src/shared/dtos/response.dto';
import { MastraMessageFormat } from '../interfaces/mastra-message-format.interface';
import { Agent, AgentEditorConfig, ToolsInput } from '@mastra/core/agent';
import { FullOutput } from '@mastra/core/stream';
import { RESPONSE_CODE } from 'src/shared/enums/response-code.enum';
import { MastraService } from '@mastra/nestjs';
import { AGENT_ID } from 'src/shared/enums/agentid.enums';
import { removeMarkdown, sanitizePayload } from './chat-helper.util';
import { MessageListInput } from '@mastra/core/agent/message-list';

export async function handleAgentResponse(
  mastraService: MastraService,
  existingChatHistory: any[],
): Promise<ResponseDTO<string>> {
  const response = new ResponseDTO<string>();

  try {
    let agent: Agent<
      any,
      ToolsInput,
      undefined,
      unknown,
      AgentEditorConfig | undefined
    >;
    if (process.env.USE_OLLAMA == 'true') {
      agent = mastraService.getAgent(AGENT_ID.OLLAMA_RAG_AGENT);
    } else {
      agent = mastraService.getAgent(AGENT_ID.OPENAI_RAG_AGENT);
    }
    let agentResponse: FullOutput<undefined> | null = null;
    // retry till agent generates a response before giving up
    const MAX_RETRIES = 3;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const completeMessageList: MastraMessageFormat[] =
          sanitizePayload(existingChatHistory);

        agentResponse = await agent.generate(
          completeMessageList as MessageListInput,
          {
            modelSettings: {
              maxOutputTokens: process.env.LLM_MAX_OUTPUT_TOKEN
                ? parseInt(process.env.LLM_MAX_OUTPUT_TOKEN)
                : 400,
            },
          },
        );

        if (agentResponse && agentResponse.text) {
          break;
        }
      } catch (error) {
        console.error('Error generating response. Retrying...', error);
        continue;
      }
    }

    if (agentResponse && agentResponse.text) {
      response.data = removeMarkdown(agentResponse.text);
      response.code = RESPONSE_CODE._200;
      response.message = 'Chat processed successfully';
    } else {
      response.data = 'System Error!';
      response.message = 'Failed to process chat, Please try again later';
      response.code = RESPONSE_CODE._500;
    }
  } catch (e) {
    console.error(e);
    response.data = 'System Error!';
    response.message = 'Failed to process chat, Please try again later';
    response.code = RESPONSE_CODE._500;
  }

  return response;
}
