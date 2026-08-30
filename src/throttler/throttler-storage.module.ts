// throttler/throttler-storage.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ThrottlerRecord,
  ThrottlerRecordSchema,
} from './throttler-record.schema.js';
import { ThrottlerStorageMongoService } from './throttler-storage-mongo.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ThrottlerRecord.name, schema: ThrottlerRecordSchema },
    ]),
  ],
  providers: [ThrottlerStorageMongoService],
  exports: [ThrottlerStorageMongoService], // <-- required for forRootAsync to see it
})
export class ThrottlerStorageModule {}
