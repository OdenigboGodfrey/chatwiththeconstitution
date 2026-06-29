import { Body, Controller, Get, Post } from '@nestjs/common';
import { TelegramService } from '../services/telegram.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('telegram-channel')
@ApiTags('telegram-channel')
export class TelegramController {
  constructor(private telegram: TelegramService) {console.log('>>> TELEGRAM CONTROLLER INSTANTIATED');}

  @Post('webhook')
  async webhook(@Body() body: any) {
    await this.telegram.handleUpdate(body);

    return { ok: true };
  }

  @Get()
  getHello() {
    console.log('>>> TELEGRAM ROUTE HIT');
    return 'Hello World!';
  }
}
