import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramService } from '../services/telegram.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('telegram-channel')
@ApiTags('telegram-channel')
export class TelegramController {
  constructor(private telegram: TelegramService) {
    console.log('>>> TELEGRAM CONTROLLER INSTANTIATED');
  }

  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string,
  ) {
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
      throw new UnauthorizedException('Invalid Telegram secret token');
    }

    await this.telegram.handleUpdate(body);

    return { ok: true };
  }

  @Get()
  getHello() {
    console.log('>>> TELEGRAM ROUTE HIT');
    return 'Hello World!';
  }
}
