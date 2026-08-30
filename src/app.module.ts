import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import {
  AppService,
  MongoTestSchema,
  MongoTestSchemaClass,
} from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { AuthPersistenceModule } from './auth/infrastructure/persistence/mongodb/auth-persistence.module.js';
import { MongoUserRepository } from './auth/infrastructure/persistence/mongodb/repositories/mongo-user.repository.js';
import { MongoSessionRepository } from './auth/infrastructure/persistence/mongodb/repositories/mongo-session.repository.js';
import { MongoIdentityRepository } from './auth/infrastructure/persistence/mongodb/repositories/mongo-identity.repository.js';
import authConfig from './auth/config/auth.config.js';
import databaseConfig from './database/config/database.config.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AppThrottlerModule } from './throttler/throttler.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      load: [authConfig, databaseConfig],
      isGlobal: true,
    }),
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY!,
      appSecret: process.env.OBSERVE_APP_SECRET!,
      serviceId: 'filmprompt-api',
    }),
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [AuthPersistenceModule],
      inject: [
        MongoUserRepository,
        MongoSessionRepository,
        MongoIdentityRepository,
      ],
      useFactory: (
        userRepository: MongoUserRepository,
        sessionRepository: MongoSessionRepository,
        identityRepository: MongoIdentityRepository,
      ) => ({
        userRepository,
        sessionRepository,
        identityRepository,
      }),
    }),
    MongooseModule.forFeature([
      { name: MongoTestSchemaClass.name, schema: MongoTestSchema },
    ]),
    AppThrottlerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
