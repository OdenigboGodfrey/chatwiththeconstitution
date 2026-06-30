import { ChatItemPayloadDTO } from '../dtos/chat-request-payload.dto';
import { ChatHistoryEntity } from '../entities/chat-history.entity';
import { MastraMessageFormat } from '../interfaces/mastra-message-format.interface';

export const defaultAssistantMessage = `Hello! Ask me anything about the Constitution or the Electoral Act, and I'll help you find the relevant provisions.`;

export const botWorkingMessage = `Please wait, I am processing your request...`;

export function sanitizePayload(
  payload: ChatHistoryEntity[] | ChatItemPayloadDTO[] = [],
): MastraMessageFormat[] {
  let completeMessageList: MastraMessageFormat[] = [];
  try {
    completeMessageList = payload.map(
      (item: ChatItemPayloadDTO | ChatHistoryEntity) => {
        const incomingRole = item.role?.toLowerCase().trim();
        // Normalize string-based roles coming from client input payloads safely
        let sanitizedRole: 'user' | 'assistant' | 'system' = 'user';
        if (incomingRole === 'assistant' || incomingRole === 'system') {
          sanitizedRole = incomingRole;
        }

        return {
          role: sanitizedRole,
          content: item.content || '',
        };
      },
    );
  } catch (error) {
    console.error(error);
  }

  return completeMessageList;
}

export function removeMarkdown(text: string): string {
  // Removes hashtags at the start of lines (headers)
  let cleanedText = text.replace(/^#+\s*/gm, '');

  // Removes asterisks used for bold/italics
  cleanedText = cleanedText.replace(/\*+/g, '');

  return cleanedText;
}
