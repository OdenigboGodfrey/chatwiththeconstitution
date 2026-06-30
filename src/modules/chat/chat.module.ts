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
import { WhatsappService } from './services/whatsapp.service';
import { WhatsappController } from './controllers/whatsapp.controller';
import { WhatsappMessageEntity } from './entities/whatsapp-message.entity';
import { WhatsappMessageRepository } from './repositories/whatsapp-message.repo';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistoryEntity, WhatsappMessageEntity]),
    MastraModule.register({
      mastra: mastra,
    }),
  ],
  controllers: [ChatController, TelegramController, WhatsappController],
  providers: [
    ChatHistoryRepository,
    WhatsappMessageRepository,
    ChatService,
    TelegramService,
    WhatsappService,
  ],
})
export class ChatModule {}
