import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { GiveawaysModule } from './giveaways/giveaways.module';
import { MessagesModule } from './messages/messages.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ThanksModule } from './thanks/thanks.module';
import { CommunitiesModule } from './communities/communities.module';
import { RedisModule } from './common/redis/redis.module';
import { EventsModule } from './common/events/events.module';
import { RateLimitMonitorGuard } from './common/guards/rate-limit-monitor.guard';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const synchronizeEnv = configService.get<string>('TYPEORM_SYNCHRONIZE');
        const synchronize =
          typeof synchronizeEnv === 'string'
            ? synchronizeEnv === 'true'
            : nodeEnv !== 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize,
          ssl: false,
          extra: {
            ssl: false,
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttl = Number(
          configService.get<string>('THROTTLE_TTL_MS', '60000'),
        );
        const limit = Number(
          configService.get<string>('THROTTLE_LIMIT', '120'),
        );

        return [
          {
            ttl,
            limit,
          },
        ];
      },
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    EventsModule,
    AuthModule,
    UsersModule,
    ItemsModule,
    GiveawaysModule,
    MessagesModule,
    CloudinaryModule,
    NotificationsModule,
    FavoritesModule,
    ThanksModule,
    CommunitiesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitMonitorGuard,
    },
  ],
})
export class AppModule {}
