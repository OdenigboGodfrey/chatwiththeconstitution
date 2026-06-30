import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ChatHistoryRepository } from '../repositories/chat-history.repo';
import { MastraService } from '@mastra/nestjs';
import {
  botWorkingMessage,
  defaultAssistantMessage,
} from '../utils/chat-helper.util';
import { handleAgentResponse } from '../utils/handle-agent.util';

@Injectable()
export class TelegramService {
  bot: Telegraf;
  defaultMessage = defaultAssistantMessage;

  constructor(
    private readonly chatHistoryRepo: ChatHistoryRepository,
    private readonly mastraService: MastraService,
  ) {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

    this.bot.start((ctx) => {
      ctx.reply(this.defaultMessage);
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(this.defaultMessage);
    });

    this.bot.on('text', (ctx) => {
      const chatId = ctx?.chat.id;
      const message = ctx?.message.text;
      console.log('User', chatId, ' sent message:', message);

      this.saveMessage(message, chatId, 'user', true)
        .then(async (record) => {
          if (!record.status) {
            console.error('Failed to save message', record.message);
            throw new Error(record.message);
          }

          const messageToLower = message.toLowerCase();
          if (
            messageToLower == 'hello' ||
            messageToLower == 'hi' ||
            messageToLower == 'hey'
          ) {
            await this.bot.telegram.sendMessage(
              chatId,
              defaultAssistantMessage,
            );
            return;
          }

          await this.bot.telegram.sendMessage(chatId, botWorkingMessage);
          const existingMessage =
            await this.chatHistoryRepo.getChatHistoryByChatAndSourceId(
              chatId.toString(),
              'telegram',
            );
          const response = await handleAgentResponse(
            this.mastraService,
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
              await this.bot.telegram.sendMessage(chatId, response.data);
              // save assistant response
              await this.chatHistoryRepo.saveAssistantMessageAndUpdateUserMessage(
                response.data,
                chatId.toString(),
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
      chatId.toString(),
      role,
      'telegram',
      responsePending,
    );
    return response;
  }
}
