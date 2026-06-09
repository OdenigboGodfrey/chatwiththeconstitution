import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MastraModule } from '@mastra/nestjs';
import { mastra } from 'src/mastra/mastra';

@Module({
  imports: [
    MastraModule.register({
      mastra: mastra,
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
