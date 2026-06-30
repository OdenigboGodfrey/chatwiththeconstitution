import { DataSource, IsNull, Not } from 'typeorm';
import { WhatsappMessageEntity } from '../entities/whatsapp-message.entity';
import { ResponseDTO } from 'src/shared/dtos/response.dto';
import { ChatHistoryEntity } from '../entities/chat-history.entity';
import { RESPONSE_CODE } from 'src/shared/enums/response-code.enum';
import { SaveChatHistoryAndWhatsappMessageInfoResponseDTO } from '../dtos/whatsapp-message-info.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappMessageRepository {
  constructor(private readonly dataSource: DataSource) {}

  async saveChatHistoryAndWhatsappMessageInfo(
    message: string,
    fromPhone: string,
    role: 'user' | 'assistant',
    source: string,
    responsePending: boolean,
    fromUserId: string,
    messageId: string,
    messageTimestamp: number,
    firstNewDayMessage: boolean,
  ): Promise<ResponseDTO<SaveChatHistoryAndWhatsappMessageInfoResponseDTO>> {
    const response =
      new ResponseDTO<SaveChatHistoryAndWhatsappMessageInfoResponseDTO>();
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
        chatHistory.sourceId = fromPhone.toString();
        chatHistory.responsePending = responsePending;
        await manager.save(chatHistory);

        const _messageTimestamp = Number(messageTimestamp) * 1000;
        const messageDate = new Date(_messageTimestamp);

        const record = new WhatsappMessageEntity();
        record.chatHistory = chatHistory;
        record.fromPhone = fromPhone;
        record.fromUserId = fromUserId;
        record.messageId = messageId;
        record.messageTimestamp = messageDate;
        if (firstNewDayMessage) {
          const expiresAt = new Date(
            messageDate.getTime() + 24 * 60 * 60 * 1000,
          );
          expiresAt.setHours(expiresAt.getHours() + 24);
          record.message24hTimestamp = expiresAt;
        }
        await manager.save(record);

        await queryRunner.commitTransaction();
        response.data = new SaveChatHistoryAndWhatsappMessageInfoResponseDTO({
          chatHistory,
          whatsappMessage: record,
        });
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

  async getWhatsappMessageInfoByMessageId(
    messageId: string,
  ): Promise<ResponseDTO<WhatsappMessageEntity>> {
    const response = new ResponseDTO<WhatsappMessageEntity>();
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        const manager = queryRunner.manager;

        const record = await manager.findOne(WhatsappMessageEntity, {
          where: {
            messageId,
          },
        });

        if (!record) {
          response.code = RESPONSE_CODE._404;
          response.message = 'Message not found';
          return response;
        }

        response.data = record;
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

  async getWhatsappMessageInfoFor24hr(fromUserId: string) {
    const response = new ResponseDTO<WhatsappMessageEntity>();
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        const manager = queryRunner.manager;

        const record = await manager.findOne(WhatsappMessageEntity, {
          where: {
            fromUserId,
            // where message24hTimestamp is not null
            message24hTimestamp: Not(IsNull()),
          },
          order: {
            createdAt: 'DESC',
          },
        });

        if (!record) {
          response.code = RESPONSE_CODE._404;
          response.message = 'Message not found';
          return response;
        }

        response.data = record;
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

  async isConversationWindowAboutToExpire(
    fromUserId: string,
    thresholdMinutes = 5,
  ): Promise<boolean> {
    const response = await this.getWhatsappMessageInfoFor24hr(fromUserId);

    // No active conversation window
    if (response.code === RESPONSE_CODE._404.toString()) {
      return true;
    }

    if (response.data.message24hTimestamp == null) {
      return true;
    }

    const expiresAt = new Date(response.data.message24hTimestamp);
    const now = new Date();
    const remainingMs = expiresAt.getTime() - now.getTime();

    return remainingMs <= thresholdMinutes * 60 * 1000;
  }
}
