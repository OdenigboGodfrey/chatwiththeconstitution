import { Module } from '@nestjs/common';
import { TelegramService } from './services/telegram.service';
import { TelegramController } from './controllers/telegram.controller';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class ChannelsModule {}
