import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const application = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const documentBuilder = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription('API for shortening URLs and managing them')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(application, documentBuilder);
  SwaggerModule.setup('api', application, documentFactory);

  const configService = application.get(ConfigService);
  const applicationPort = configService.get('applicationPort');

  await application.listen(applicationPort);
}
bootstrap();
