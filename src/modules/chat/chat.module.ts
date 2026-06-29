import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { MastraModule } from '@mastra/nestjs';
import { mastra } from 'src/mastra/mastra';
import { TelegramController } from './controllers/telegram.controller';
import { TelegramService } from './services/telegram.service';
import { ChatHistoryEntity } from './entities/chat-history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatHistoryRepository } from './repositories/chat-history.repo';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistoryEntity]),
    MastraModule.register({
      mastra: mastra,
    }),
  ],
  controllers: [ChatController, TelegramController],
  providers: [ChatHistoryRepository, ChatService, TelegramService],
})
export class ChatModule {}
