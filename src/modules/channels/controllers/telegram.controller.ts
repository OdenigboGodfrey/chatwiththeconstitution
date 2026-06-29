import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from '../services/telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private telegram: TelegramService) {}

  @Post('webhook')
  async webhook(@Body() body: any) {
    await this.telegram.handleUpdate(body);

    return { ok: true };
  }
}
