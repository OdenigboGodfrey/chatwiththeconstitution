import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './modules/chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

console.log('process.env.DATABASE_HOST', process.env.DATABASE_HOST);
console.log('process.env.DATABASE_PORT', process.env.DATABASE_PORT);
console.log('process.env.DATABASE_USER', process.env.DATABASE_USER);
console.log('process.env.DATABASE_PASSWORD', process.env.DATABASE_PASSWORD);
console.log('process.env.DATABASE', process.env.DATABASE);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5435'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE,
      autoLoadEntities: true,
      synchronize: false,
      logging: true,
      ssl:
        process.env.DATABASE_REQUIRE_SSL === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    }),
    ChatModule,
    // ChannelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
