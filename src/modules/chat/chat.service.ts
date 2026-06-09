import { FullOutput } from '@mastra/core/stream';
import { MastraService } from '@mastra/nestjs';
import { Injectable } from '@nestjs/common';
import { ResponseDTO } from 'src/shared/dtos/response.dto';
import { AGENT_ID } from 'src/shared/enums/agentid.enums';
import { RESPONSE_CODE } from 'src/shared/enums/response-code.enum';
import { ChatWithHistoryRequestPayloadDTO } from './dtos/chat-request-payload.dto';
import { MessageListInput } from '@mastra/core/agent/message-list';

interface MastraMessageFormat {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly mastraService: MastraService) {}

  async handleChat(text: string): Promise<ResponseDTO<string>> {
    const response = new ResponseDTO<string>();
    try {
      const agent = this.mastraService.getAgent(AGENT_ID.OPENAI_RAG_AGENT);
      let agentResponse: FullOutput<undefined> | null = null;
      const MAX_RETRIES = 3;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          // retry till agent generates a response before giving up
          agentResponse = await agent.generate(text, {
            modelSettings: {
              maxOutputTokens: 1200,
              headers: {
                Authorization: `Bearer ${process.env.LLM_API_KEY}`,
              },
            },
          });
          if (agentResponse && agentResponse.text) {
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
      if (agentResponse && agentResponse.text) {
        response.data = agentResponse.text;
        response.code = RESPONSE_CODE._200;
        response.message = 'Chat processed successfully';
      } else {
        response.data = 'System Error!';
        response.message = 'Failed to process chat, Please try again later';
        response.code = RESPONSE_CODE._500;
      }
    } catch (e) {
      console.log(e);
      response.data = '';
      response.message =
        'An error occurred while processing chat. Please try again later';
      response.code = RESPONSE_CODE._500;
    }

    return response;
  }

  async handleChatWithHistory(
    payload: ChatWithHistoryRequestPayloadDTO,
  ): Promise<ResponseDTO<string>> {
    const response = new ResponseDTO<string>();
    try {
      //   const agent = this.mastraService.getAgent(AGENT_ID.OLLAMA_RAG_AGENT);
      const agent = this.mastraService.getAgent(AGENT_ID.OPENAI_RAG_AGENT);
      let agentResponse: FullOutput<undefined> | null = null;
      const MAX_RETRIES = 3;

      // 2. convert the payload history array elements into Mastra shapes
      const completeMessageList: MastraMessageFormat[] = (
        payload.history || []
      ).map((item) => {
        // Normalize string-based roles coming from client input payloads safely
        let sanitizedRole: 'user' | 'assistant' | 'system' = 'user';

        const incomingRole = item.role?.toLowerCase().trim();
        if (incomingRole === 'assistant' || incomingRole === 'system') {
          sanitizedRole = incomingRole;
        }

        return {
          role: sanitizedRole,
          content: item.content || '',
        };
      });

      // 3. Append the newest active prompt message payload directly onto the end of the history array
      completeMessageList.push({
        role: 'user',
        content: payload.text,
      });
      //   console.log('completeMessageList', completeMessageList);
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          agentResponse = await agent.generate(
            completeMessageList as MessageListInput,
            {
              modelSettings: {
                maxOutputTokens: 1200,
              },
            },
          );

          if (agentResponse && agentResponse.text) {
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }

      if (agentResponse && agentResponse.text) {
        response.data = agentResponse.text;
        response.code = RESPONSE_CODE._200;
        response.message = 'Chat processed successfully';
      } else {
        response.data = 'System Error!';
        response.message = 'Failed to process chat, Please try again later';
        response.code = RESPONSE_CODE._500;
      }
    } catch (e) {
      console.error('Error compiling manual DTO history stack:', e);
      response.data = '';
      response.message =
        'An error occurred while processing chat. Please try again later';
      response.code = RESPONSE_CODE._500;
    }

    return response;
  }
}
