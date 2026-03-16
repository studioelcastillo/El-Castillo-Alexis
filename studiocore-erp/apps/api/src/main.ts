import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableShutdownHooks();

  app.setGlobalPrefix(process.env.API_GLOBAL_PREFIX || 'api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('StudioCore ERP API')
    .setDescription('API base del nuevo StudioCore ERP')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(process.env.API_DOCS_PATH || 'docs', app, document);

  const port = Number(process.env.API_PORT || 4102);
  await app.listen(port);

  process.stdout.write(`StudioCore API running on http://localhost:${port}\n`);
}

bootstrap();
