import { ChatHistoryEntity } from '../entities/chat-history.entity';
import { WhatsappMessageEntity } from '../entities/whatsapp-message.entity';

export class SaveChatHistoryAndWhatsappMessageInfoResponseDTO {
  constructor(
    init?: Partial<SaveChatHistoryAndWhatsappMessageInfoResponseDTO>,
  ) {
    Object.assign(this, init);
  }
  chatHistory!: ChatHistoryEntity;
  whatsappMessage!: WhatsappMessageEntity;
}
