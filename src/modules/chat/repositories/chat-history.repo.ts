import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatHistoryEntity } from '../entities/chat-history.entity';
import { ResponseDTO } from 'src/shared/dtos/response.dto';
import { RESPONSE_CODE } from 'src/shared/enums/response-code.enum';

@Injectable()
export class ChatHistoryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async saveMessage(
    message: string,
    chatId: number,
    role: 'user' | 'assistant',
    source: string,
    responsePending: boolean,
  ): Promise<ResponseDTO<ChatHistoryEntity>> {
    const response = new ResponseDTO<ChatHistoryEntity>();
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const manager = queryRunner.manager;

        const chatHistory = new ChatHistoryEntity();
        chatHistory.content = message;
        chatHistory.role = role;
        chatHistory.source = source;
        chatHistory.sourceId = chatId;
        chatHistory.responsePending = responsePending;
        await manager.save(chatHistory);

        await queryRunner.commitTransaction();
        response.data = chatHistory;
        response.code = RESPONSE_CODE._200;
        response.message = 'Message saved successfully';
      } catch (error) {
        console.error(error);
        response.code = RESPONSE_CODE._500;
        response.message =
          'Failed to save message at this time, please try again';
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error(error);
      response.code = RESPONSE_CODE._500;
      response.message = 'Failed to save message, please try again';
      throw error;
    }

    return response;
  }

  async saveAssistantMessageAndUpdateUserMessage(
    message: string,
    chatId: number,
    role: 'user' | 'assistant',
    source: string,
    messageId: string,
  ): Promise<ResponseDTO<ChatHistoryEntity>> {
    const response = new ResponseDTO<ChatHistoryEntity>();
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const manager = queryRunner.manager;

        const chatHistory = new ChatHistoryEntity();
        chatHistory.content = message;
        chatHistory.role = role;
        chatHistory.source = source;
        chatHistory.sourceId = chatId;
        chatHistory.responsePending = false;
        await manager.save(chatHistory);

        // update user message
        await manager.update(
          ChatHistoryEntity,
          { id: messageId },
          { responsePending: false },
        );

        await queryRunner.commitTransaction();
        response.data = chatHistory;
        response.code = RESPONSE_CODE._200;
        response.message = 'Message saved successfully';
      } catch (error) {
        console.error(error);
        response.code = RESPONSE_CODE._500;
        response.message =
          'Failed to save message at this time, please try again';
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error(error);
      response.code = RESPONSE_CODE._500;
      response.message = 'Failed to save message, please try again';
      throw error;
    }

    return response;
  }

  async getChatHistoryByChatAndSourceId(
    chatId: number,
    source: string,
  ): Promise<ResponseDTO<ChatHistoryEntity[]>> {
    const response = new ResponseDTO<ChatHistoryEntity[]>();
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        const manager = queryRunner.manager;

        const chatHistory = await manager.find(ChatHistoryEntity, {
          where: {
            sourceId: chatId,
            source: source,
          },
        });

        response.data = chatHistory;
        response.code = RESPONSE_CODE._200;
        response.message = 'Message fetched successfully';
      } catch (error) {
        console.error(error);
        response.code = RESPONSE_CODE._500;
        response.message =
          'Failed to fetch message at this time, please try again';
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error(error);
      response.code = RESPONSE_CODE._500;
      response.message = 'Failed to save message, please try again';
      throw error;
    }

    return response;
  }
}
