import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
  bot: Telegraf;
  defaultMessage = `Hello! Ask me anything about the Constitution or the Electoral Act, and I'll help you find the relevant provisions.`;

  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

    this.bot.start((ctx) => {
      ctx.reply(this.defaultMessage);
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(this.defaultMessage);
    });

    this.bot.on('text', (ctx) => {
      ctx.reply(`You said: ${ctx.message.text}`);
    });
  }

  async handleUpdate(update: any) {
    await this.bot.handleUpdate(update);
  }
}
