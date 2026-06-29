import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'chat_history',
})
export class ChatHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sourceId!: number;

  @Column()
  role!: string;

  @Column()
  content!: string;

  @Column()
  source!: string;

  @Column()
  responsePending!: boolean;

  @Column()
  retryCount!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
