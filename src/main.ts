console.log('DEBUG: main.ts is executing...');
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  try {
    console.log('DEBUG: Creating Nest App...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    console.log('DEBUG: Nest App Created. Configuring CORS...');
    app.enableCors({
      origin: true, // Allow all origins (including 192.168.1.179)
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Digital Goodwill Box API')
      .setDescription('Döngü Sitesi API Dokümantasyonu')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3005;
    console.log(`DEBUG: Listening on port ${port}...`);
    await app.listen(port);

    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      console.log(
        `✅ Veritabanına başarıyla bağlanıldı (Port: ${process.env.DB_PORT || 5433})`,
      );
    } else {
      console.error(
        `❌ Veritabanı bağlantısı kurulamadı (Port: ${process.env.DB_PORT || 5433})`,
      );
    }

    console.log(`\n🚀 Backend is running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/api\n`);
  } catch (error) {
    console.error('❌ Error starting the application:', error);
  }
}
console.log('DEBUG: Imports finished. Calling bootstrap...');
bootstrap();
