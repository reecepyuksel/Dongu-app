import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getAllowedOrigins } from './common/config/cors-origins';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // CORS: only allow explicitly configured origins; never wildcard in production
  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Döngü API')
    .setDescription('Döngü Platform API Dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3005;
  await app.listen(port);

  const dataSource = app.get(DataSource);
  if (dataSource.isInitialized) {
    logger.log(
      `✅ DB bağlantısı başarılı (Port: ${process.env.DB_PORT ?? 5433})`,
    );
  } else {
    logger.error(`❌ DB bağlantısı kurulamadı`);
  }

  logger.log(`🚀 Backend: http://localhost:${port}`);
  logger.log(`📚 Swagger: http://localhost:${port}/api`);
}

bootstrap();
