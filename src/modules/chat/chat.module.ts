import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { MastraModule } from '@mastra/nestjs';
import { mastra } from 'src/mastra/mastra';
import { TelegramController } from './controllers/telegram.controller';
import { TelegramService } from './services/telegram.service';

@Module({
  imports: [
    MastraModule.register({
      mastra: mastra,
    }),
  ],
  controllers: [ChatController, TelegramController],
  providers: [ChatService, TelegramService],
})
export class ChatModule {}
