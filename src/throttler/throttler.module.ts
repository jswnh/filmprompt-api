// throttler/throttler.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageModule } from './throttler-storage.module.js';
import { ThrottlerStorageMongoService } from './throttler-storage-mongo.service.js';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ThrottlerStorageModule], // now resolvable
      inject: [ThrottlerStorageMongoService],
      useFactory: (storage: ThrottlerStorageMongoService) => ({
        throttlers: [{ ttl: 60000, limit: 10 }],
        storage,
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
