import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ChatHistoryRepository } from '../repositories/chat-history.repo';
import { MastraService } from '@mastra/nestjs';
import { AGENT_ID } from 'src/shared/enums/agentid.enums';
import { FullOutput } from '@mastra/core/stream';
import { removeMarkdown, sanitizePayload } from '../utils/chat-helper.util';
import { MastraMessageFormat } from '../interfaces/mastra-message-format.interface';
import { MessageListInput } from '@mastra/core/agent/message-list';
import { ResponseDTO } from 'src/shared/dtos/response.dto';
import { RESPONSE_CODE } from 'src/shared/enums/response-code.enum';
import { Agent, AgentEditorConfig, ToolsInput } from '@mastra/core/agent';

@Injectable()
export class TelegramService {
  bot: Telegraf;
  defaultMessage = `Hello! Ask me anything about the Constitution or the Electoral Act, and I'll help you find the relevant provisions.`;

  constructor(
    private readonly chatHistoryRepo: ChatHistoryRepository,
    private readonly mastraService: MastraService,
  ) {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

    this.bot.start((ctx) => {
      console.log('Chat ID:', ctx.chat.id);
      ctx.reply(this.defaultMessage);
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(this.defaultMessage);
    });

    this.bot.on('text', (ctx) => {
      const chatId = ctx.chat.id;
      const message = ctx.message.text;
      console.log('User', chatId, ' sent message:', message);

      this.saveMessage(message, chatId, 'user', true)
        .then(async (record) => {
          if (!record.status) {
            console.error('Failed to save message', record.message);
            throw new Error(record.message);
          }

          console.log('Message saved');
          await this.bot.telegram.sendMessage(
            chatId,
            'Please wait, I am processing your request...',
          );
          const existingMessage =
            await this.chatHistoryRepo.getChatHistoryByChatAndSourceId(
              chatId,
              'telegram',
            );
          const response = await this.handleAgentResponse(
            existingMessage.status
              ? existingMessage.data
              : [
                  {
                    content: message,
                    role: 'user',
                  },
                ],
          );
          if (response.status) {
            try {
              // const ctxResponse = await ctx.reply(response.data);
              const ctxResponse = this.bot.telegram.sendMessage(
                chatId,
                response.data,
              );
              console.log('Response sent', ctxResponse);
              // save assistant response
              await this.chatHistoryRepo.saveAssistantMessageAndUpdateUserMessage(
                response.data,
                chatId,
                'assistant',
                'telegram',
                record.data.id,
              );
            } catch (error) {
              console.error(error);
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
      // ctx.reply(`You said: ${ctx.message.text}`);
    });
  }

  async handleUpdate(update: any) {
    await this.bot.handleUpdate(update);
  }

  private async saveMessage(
    message: string,
    chatId: number,
    role: 'user' | 'assistant',
    responsePending: boolean,
  ) {
    const response = await this.chatHistoryRepo.saveMessage(
      message,
      chatId,
      role,
      'telegram',
      responsePending,
    );
    console.log('Saved message', response);
    return response;
  }

  private async handleAgentResponse(
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
        agent = this.mastraService.getAgent(AGENT_ID.OLLAMA_RAG_AGENT);
      } else {
        agent = this.mastraService.getAgent(AGENT_ID.OPENAI_RAG_AGENT);
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
                maxOutputTokens: 1200,
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
}
