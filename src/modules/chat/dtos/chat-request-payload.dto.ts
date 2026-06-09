import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestPayloadDTO {
  constructor(init?: Partial<ChatRequestPayloadDTO>) {
    Object.assign(this, init);
  }

  @ApiProperty() text!: string;
}

export class ChatWithHistoryRequestPayloadDTO {
  constructor(init?: Partial<ChatWithHistoryRequestPayloadDTO>) {
    Object.assign(this, init);
  }

  @ApiProperty() text!: string;
  @ApiProperty({
    type: () => ChatItemPayloadDTO,
    isArray: true,
    description: 'Chat history',
  })
  history!: ChatItemPayloadDTO[];
}

export class ChatItemPayloadDTO {
  constructor(init?: Partial<ChatItemPayloadDTO>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  role!: string;

  @ApiProperty()
  content!: string;
}
