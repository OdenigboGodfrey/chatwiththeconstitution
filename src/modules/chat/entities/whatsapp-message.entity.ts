import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ChatHistoryEntity } from './chat-history.entity';

@Entity('whatsapp_messages', { schema: process.env.DATABASE_SCHEMA })
export class WhatsappMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'from_phone',
    type: 'varchar',
    length: 100,
  })
  fromPhone!: string;

  @Column({
    name: 'from_user_id',
    type: 'varchar',
    length: 255,
  })
  fromUserId!: string;

  @Column({
    name: 'message_id',
    type: 'varchar',
    length: 512,
  })
  messageId!: string;

  @Column({
    name: 'message_timestamp',
    type: 'timestamptz',
  })
  messageTimestamp!: Date;

  @Column({
    name: 'message_24h_timestamp',
    type: 'timestamptz',
    nullable: true,
  })
  message24hTimestamp?: Date | null;

  @OneToOne(() => ChatHistoryEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'chat_history_id' })
  chatHistory?: ChatHistoryEntity | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
