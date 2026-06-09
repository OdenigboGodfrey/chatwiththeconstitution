import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  ChatRequestPayloadDTO,
  ChatWithHistoryRequestPayloadDTO,
} from './dtos/chat-request-payload.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('chat')
@ApiTags('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('')
  @HttpCode(200)
  async chat(@Body() payload: ChatRequestPayloadDTO) {
    const response = await this.chatService.handleChat(payload.text);
    return response.getResponse();
  }

  @Post('with-history')
  @HttpCode(200)
  async chatWithHistory(@Body() payload: ChatWithHistoryRequestPayloadDTO) {
    const response = await this.chatService.handleChatWithHistory(payload);
    return response.getResponse();
  }
}
