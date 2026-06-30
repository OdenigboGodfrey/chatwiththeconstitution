/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import {
  botWorkingMessage,
  defaultAssistantMessage,
} from '../utils/chat-helper.util';
import { ChatHistoryRepository } from '../repositories/chat-history.repo';
import { MastraService } from '@mastra/nestjs';
import { handleAgentResponse } from '../utils/handle-agent.util';
import { WhatsappMessageRepository } from '../repositories/whatsapp-message.repo';
import { RESPONSE_CODE } from 'src/shared/enums/response-code.enum';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly chatHistoryRepo: ChatHistoryRepository,
    private readonly whatsappMessageInfoRepo: WhatsappMessageRepository,
    private readonly mastraService: MastraService,
  ) {}
  private VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
  private ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  private PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // send text message
  async sendTextMessage(toPhone: string, message: string, toUserId: string) {
    try {
      const canSend = await this.canSendMessage(toUserId);
      if (!canSend) {
        console.log(
          `Conversation window for ${toUserId} is about to expire. Skipping message.`,
        );
        return;
      }
      const url = `https://graph.facebook.com/v25.0/${this.PHONE_NUMBER_ID}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  // Verification handshake
  verifyWebhook(mode: string, token: string, challenge: string, res: Response) {
    if (mode === 'subscribe' && token === this.VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  }

  // Handle incoming WhatsApp messages
  async handleIncomingMessage(body: any) {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];
      console.log('new message received', message);
      if (!message) {
        console.log('No message found in webhook payload');
        return;
      }
      if (message.type !== 'text') {
        return;
      }

      const messageId = message.id as string;
      const fromUserId = message.from_user_id as string;
      const messageTimestamp = message.timestamp as number;

      // check if message is already processed
      const existingMessage =
        await this.whatsappMessageInfoRepo.getWhatsappMessageInfoByMessageId(
          messageId,
        );
      if (existingMessage.status) {
        console.log('Message with that id already received');
        return;
      }
      // get last 24hrs message info
      let firstNewDayMessage =
        await this.whatsappMessageInfoRepo.isConversationWindowAboutToExpire(
          fromUserId,
        );
      const last24HoursMessageInfo =
        await this.whatsappMessageInfoRepo.getWhatsappMessageInfoFor24hr(
          fromUserId,
        );

      if (last24HoursMessageInfo.code == RESPONSE_CODE._404.toString()) {
        // no record found
        firstNewDayMessage = true;
      }
      // todo: handle other first day new messages

      const from = message.from; // sender phone number
      let text = (message.text?.body as string) || '';
      text = text.trim().toLowerCase();

      console.log('New WhatsApp message');
      console.log('From:', from);
      console.log('Message:', text);

      // save message
      const userMessageResponse =
        await this.whatsappMessageInfoRepo.saveChatHistoryAndWhatsappMessageInfo(
          text,
          from,
          'user',
          'whatsapp',
          true,
          fromUserId,
          messageId,
          messageTimestamp,
          firstNewDayMessage,
        );
      if (!userMessageResponse.status) {
        console.error('Failed to save message', userMessageResponse.message);
        await this.sendTextMessage(
          from,
          'Something went wrong while processing your request. Please try again later.',
          fromUserId,
        );
        // throw new Error(userMessageResponse.message);
        return;
      }

      console.log('WhatApp Message saved');
      if (text == 'hello' || text == 'hi' || text == 'hey') {
        await this.sendTextMessage(from, defaultAssistantMessage, fromUserId);
        return;
      }
      console.log('Processing message...');
      await this.sendTextMessage(from, botWorkingMessage, fromUserId);

      const existingMessages =
        await this.chatHistoryRepo.getChatHistoryByChatAndSourceId(
          from,
          'whatsapp',
        );
      console.log('Existing messages:', existingMessages.data.length);

      const agentResponse = await handleAgentResponse(
        this.mastraService,
        existingMessages.status
          ? existingMessages.data
          : [
              {
                content: text,
                role: 'user',
              },
            ],
      );
      console.log('Agent response:', agentResponse.data);
      if (agentResponse.status) {
        const assistantMessage = agentResponse.data;
        await this.sendTextMessage(from, assistantMessage, fromUserId);
        await this.chatHistoryRepo.saveAssistantMessageAndUpdateUserMessage(
          agentResponse.data,
          from,
          'assistant',
          'whatsapp',
          userMessageResponse.data.chatHistory.id,
        );
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }

  private async canSendMessage(fromUserId: string): Promise<boolean> {
    const aboutToExpire =
      await this.whatsappMessageInfoRepo.isConversationWindowAboutToExpire(
        fromUserId,
        5, // don't send if less than 5 mins left
      );

    return !aboutToExpire;
  }
}
