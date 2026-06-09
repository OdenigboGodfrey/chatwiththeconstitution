import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { initializeKnowledgeBase } from './startup/initialize-knowledge-base';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Chat With the Constitution API Doc')
    .setDescription('The official Chat With the Constitution API')
    .setVersion('1.0')
    .addTag('Chat With the Constitution Description')
    .addBearerAuth({
      name: 'Authorization',
      type: 'http',
      bearerFormat: 'JWT',
      scheme: 'Bearer',
      in: 'header',
      description: `JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.`,
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await initializeKnowledgeBase()
    .then((result) => {
      if (!result.status) {
        console.error('error', result.message);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('caught error', err);
      process.exit(1);
    });

  app.enableCors({
    origin: '*',
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
